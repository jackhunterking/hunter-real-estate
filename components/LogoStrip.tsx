import styles from "./LogoStrip.module.css";

interface LogoConfig {
  name: string;
  src?: string;
  invert?: boolean;
}

const LOGOS: LogoConfig[] = [
  { name: "RE/MAX Hallmark", src: "/logos/remax-logo.png" },
  { name: "Platinum Club", src: "/logos/platinum-logo.jpg", invert: true },
  { name: "Executive Club", src: "/logos/executive-logo.jpg", invert: true },
  { name: "100% Club", src: "/logos/100club-logo.jpg", invert: true },
];

export default function LogoStrip() {
  return (
    <section className={styles.strip}>
      <div className="container">
        <div className={styles.eyebrow}>Akredite Kurumlar &amp; Ödüller</div>
        <div className={styles.row}>
          {LOGOS.map((logo) => (
            <div key={logo.name} className={styles.slot}>
              {logo.src ? (
                // Fixed public assets are styled by the existing logo-strip CSS.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.src}
                  alt={logo.name}
                  style={logo.invert ? { filter: "invert(1) brightness(2)" } : undefined}
                />
              ) : (
                <div className={styles.placeholder}>
                  {logo.name}
                  <small>▢ Logo</small>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
