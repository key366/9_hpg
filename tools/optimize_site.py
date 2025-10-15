#!/usr/bin/env python3
"""
Lightweight static-site optimizer.

What it does (safe defaults):
- Minify HTML (htmlmin)
- Minify CSS (rcssmin)
- Minify JS (rjsmin)
- Convert JPG/PNG to WebP (optional, default ON) with Pillow
- Copy other assets (fonts, SVG, existing WEBP, GIF) unchanged

Usage:
    python tools/optimize_site.py --src . --out dist

Notes:
 - External URLs (http:// or https:// or //) are ignored and left unchanged.
 - Assumption: converting images to WebP is acceptable for your deployment. Use --no-convert to skip conversion.
"""

import argparse
import shutil
from pathlib import Path
import sys
import io
import os
from tqdm import tqdm

try:
    import htmlmin
    from bs4 import BeautifulSoup
    import rcssmin
    import rjsmin
    from PIL import Image
except Exception as e:
    print("missing dependency:", e)
    print("Please run: pip install -r tools/requirements.txt")
    sys.exit(1)


SKIP_CONVERT = False


def is_external(url: str):
    if not url:
        return False
    return url.startswith('http://') or url.startswith('https://') or url.startswith('//')


def ensure_parent(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)


def minify_css(text: str) -> str:
    try:
        return rcssmin.cssmin(text)
    except Exception:
        return text


def minify_js(text: str) -> str:
    try:
        return rjsmin.jsmin(text)
    except Exception:
        return text


def minify_html(text: str) -> str:
    try:
        return htmlmin.minify(text, remove_comments=True, reduce_empty_attributes=True, remove_empty_space=True)
    except Exception:
        return text


def convert_image(src_path: Path, out_path: Path, quality=80):
    try:
        img = Image.open(src_path)
        # Convert to RGB for formats that don't support transparency
        if img.mode in ("RGBA", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        else:
            img = img.convert('RGB')
        ensure_parent(out_path)
        img.save(out_path, 'WEBP', quality=quality, method=6)
        return True
    except Exception as e:
        # fallback: copy original
        shutil.copy2(src_path, out_path)
        return False


def process_file(path: Path, src_root: Path, out_root: Path, convert_images=True):
    rel = path.relative_to(src_root)
    out_path = out_root / rel
    ext = path.suffix.lower()

    if ext in ['.html', '.htm']:
        text = path.read_text(encoding='utf-8', errors='ignore')
        soup = BeautifulSoup(text, 'html.parser')

        # Update <link rel=stylesheet>
        for link in soup.find_all('link', href=True):
            href = link['href']
            if is_external(href):
                continue
            # nothing to change for local CSS; will exist in same relative path

        # Update <script src=>
        for sc in soup.find_all('script', src=True):
            src = sc['src']
            if is_external(src):
                continue

        # Update <img>
        for img in soup.find_all('img', src=True):
            src = img['src']
            if is_external(src):
                continue
            p = (src_root / src).resolve()
            if convert_images and p.exists() and p.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                new_rel = Path(src).with_suffix('.webp')
                img['src'] = str(new_rel).replace('\\', '/')

        # Write minified HTML
        minified = minify_html(str(soup))
        ensure_parent(out_path)
        out_path.write_text(minified, encoding='utf-8')

    elif ext == '.css':
        text = path.read_text(encoding='utf-8', errors='ignore')
        out_text = minify_css(text)
        ensure_parent(out_path)
        out_path.write_text(out_text, encoding='utf-8')

    elif ext == '.js':
        text = path.read_text(encoding='utf-8', errors='ignore')
        out_text = minify_js(text)
        ensure_parent(out_path)
        out_path.write_text(out_text, encoding='utf-8')

    elif ext in ['.jpg', '.jpeg', '.png']:
        # convert to webp by default
        if convert_images:
            out_conv = (out_path.with_suffix('.webp'))
            success = convert_image(path, out_conv)
            if not success:
                # fallback copy original file
                ensure_parent(out_path)
                shutil.copy2(path, out_path)
        else:
            ensure_parent(out_path)
            shutil.copy2(path, out_path)

    else:
        # copy other files as-is
        ensure_parent(out_path)
        shutil.copy2(path, out_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--src', default='.', help='source folder')
    parser.add_argument('--out', default='dist', help='output folder')
    parser.add_argument('--no-convert', dest='convert', action='store_false', help='do not convert images to webp')
    parser.add_argument('--quality', type=int, default=80, help='webp quality')
    args = parser.parse_args()

    src_root = Path(args.src).resolve()
    out_root = Path(args.out).resolve()

    if out_root.exists():
        shutil.rmtree(out_root)
    out_root.mkdir(parents=True, exist_ok=True)

    files = [p for p in src_root.rglob('*') if p.is_file()]

    sizes_before = 0
    sizes_after = 0

    for p in tqdm(files, desc='Processing'):
        try:
            sizes_before += p.stat().st_size
            process_file(p, src_root, out_root, convert_images=args.convert)
            # add size of resulting file(s)
        except Exception as e:
            print('error processing', p, e)

    # compute size of out_root
    for p in out_root.rglob('*'):
        if p.is_file():
            sizes_after += p.stat().st_size

    print('\nSummary:')
    print('  source total: {:.2f} KB'.format(sizes_before / 1024))
    print('  dist total:   {:.2f} KB'.format(sizes_after / 1024))
    if sizes_before > 0:
        saved = (sizes_before - sizes_after) / sizes_before * 100
        print('  saved: {:.2f}%'.format(saved))


if __name__ == '__main__':
    main()
