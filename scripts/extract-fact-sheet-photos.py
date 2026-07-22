#!/usr/bin/env python3
"""One-shot tool: extract embedded property photos from the fund fact-sheet
PDFs in public/capital/docs/ into public/capital/photos/<offering-slug>/.

Not part of the build. Run manually, then curate by hand (delete charts,
logos, headshots; rename keepers to stable names) before wiring the files
into lib/capital/data.ts media slots.

Usage: python3 scripts/extract-fact-sheet-photos.py
"""

from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "public" / "capital" / "docs"
PHOTOS = ROOT / "public" / "capital" / "photos"

# fact-sheet PDF -> offering slug the photos belong to
SOURCES = {
    "legacy-class-a-fact-sheet-2026-01-30.pdf": "legacy-epiphany",
    "lankin-apartment-reit-fact-sheet-q1-2026-class-a.pdf": "lankin-apartment-reit",
    "lankin-apartment-reit-fact-sheet-q2-2025.pdf": "lankin-apartment-reit",
}

MIN_BYTES = 50_000  # skip logos, icons, small decorations


def main() -> None:
    for pdf_name, slug in SOURCES.items():
        pdf_path = DOCS / pdf_name
        if not pdf_path.exists():
            print(f"skip (missing): {pdf_path}")
            continue
        out_dir = PHOTOS / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        reader = PdfReader(pdf_path)
        stem = pdf_path.stem
        kept = skipped = 0
        for page_no, page in enumerate(reader.pages, start=1):
            for img_no, image in enumerate(page.images, start=1):
                data = image.data
                if len(data) < MIN_BYTES:
                    skipped += 1
                    continue
                ext = Path(image.name).suffix or ".jpg"
                out = out_dir / f"raw-{stem}-p{page_no}-{img_no}{ext}"
                out.write_bytes(data)
                kept += 1
                print(f"  wrote {out.relative_to(ROOT)} ({len(data) // 1024} KB)")
        print(f"{pdf_name}: kept {kept}, skipped {skipped} small images")


if __name__ == "__main__":
    main()
