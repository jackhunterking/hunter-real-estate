/**
 * A minimal Chrome DevTools Protocol client — enough to screenshot a local HTML
 * file at exact pixel dimensions, with no npm dependency.
 *
 * Why not `chrome --headless --screenshot`: that flag captures the *window*,
 * while the page lays out in a viewport 78px shorter (macOS window chrome is
 * counted in `--window-size`), so every card came out with a white band at the
 * bottom and its footer clipped. `Emulation.setDeviceMetricsOverride` sets the
 * viewport itself, so 1080×1350 in means 1080×1350 out.
 *
 * It also keeps one browser alive for the whole batch instead of paying a cold
 * Chrome start per card — 39 building cards render in seconds, not minutes.
 *
 * Node's global WebSocket (22+) is the transport; nothing is installed.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean) as string[];

export function findChrome(): string {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "No Chrome found. Set CHROME_BIN, or run with --html and screenshot the HTML yourself.",
    );
  }
  return found;
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

export class Shooter {
  #proc: ChildProcess;
  #ws: WebSocket;
  #profile: string;
  #nextId = 1;
  #pending = new Map<number, Pending>();
  #events = new Map<string, () => void>();
  #sessionId?: string;

  private constructor(proc: ChildProcess, ws: WebSocket, profile: string) {
    this.#proc = proc;
    this.#ws = ws;
    this.#profile = profile;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && this.#pending.has(msg.id)) {
        const p = this.#pending.get(msg.id)!;
        this.#pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      } else if (msg.method) {
        this.#events.get(msg.method)?.();
      }
    });
  }

  /** Launch Chrome, attach to a fresh page target, and get ready to shoot. */
  static async launch(chrome: string): Promise<Shooter> {
    const profile = mkdtempSync(join(tmpdir(), "hnc-social-"));
    const proc = spawn(chrome, [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ]);

    // Chrome prints its WebSocket endpoint on stderr once it is listening.
    const endpoint = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Chrome did not start in 20s")), 20_000);
      let buf = "";
      proc.stderr?.on("data", (chunk) => {
        buf += String(chunk);
        const m = buf.match(/ws:\/\/[^\s]+/);
        if (m) {
          clearTimeout(timer);
          resolve(m[0]);
        }
      });
      proc.on("exit", (code) => reject(new Error(`Chrome exited early (${code})`)));
    });

    const ws = new WebSocket(endpoint);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("CDP socket failed")), { once: true });
    });

    const shooter = new Shooter(proc, ws, profile);
    const { targetId } = await shooter.#send<{ targetId: string }>("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await shooter.#send<{ sessionId: string }>("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    shooter.#sessionId = sessionId;
    await shooter.#send("Page.enable");
    return shooter;
  }

  #send<T = void>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.#nextId++;
    const payload: Record<string, unknown> = { id, method, params };
    if (this.#sessionId && method !== "Target.createTarget" && method !== "Target.attachToTarget") {
      payload.sessionId = this.#sessionId;
    }
    this.#ws.send(JSON.stringify(payload));
    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      setTimeout(() => {
        if (this.#pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30_000);
    });
  }

  /** Render a local HTML file to a PNG at exactly `width` × `height`. */
  async shoot(htmlPath: string, pngPath: string, width: number, height: number): Promise<void> {
    await this.#send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 20_000);
      this.#events.set("Page.loadEventFired", () => {
        clearTimeout(timer);
        this.#events.delete("Page.loadEventFired");
        resolve();
      });
    });
    await this.#send("Page.navigate", { url: `file://${htmlPath}` });
    await loaded;

    // Fonts and CDN photos must be decoded before the capture, or a card ships
    // with fallback type or an empty photo well.
    await this.#send("Runtime.evaluate", {
      expression: `(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(img =>
          img.complete ? img.decode().catch(() => {}) : new Promise(r => {
            img.addEventListener('load', r, {once:true});
            img.addEventListener('error', r, {once:true});
          })));
      })()`,
      awaitPromise: true,
    });

    const { data } = await this.#send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    writeFileSync(pngPath, Buffer.from(data, "base64"));
  }

  async close(): Promise<void> {
    try {
      this.#ws.close();
      this.#proc.kill("SIGKILL");
    } finally {
      rmSync(this.#profile, { recursive: true, force: true });
    }
  }
}
