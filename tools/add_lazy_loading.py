#!/usr/bin/env python3
"""Add loading="lazy" to local <img> tags in HTML files and generate a deployment manifest."""
from pathlib import Path
from bs4 import BeautifulSoup
import shutil
import argparse


def is_external(src: str) -> bool:
    if not src:
        return False
    return src.startswith('http://') or src.startswith('https://') or src.startswith('//')


def process_html(path: Path):
    text = path.read_text(encoding='utf-8', errors='ignore')
    soup = BeautifulSoup(text, 'html.parser')
    changed = False
    imgs = soup.find_all('img')
    for img in imgs:
        src = img.get('src')
        if not src:
            continue
        if is_external(src):
            continue
        # if image is a data URI, skip
        if src.strip().startswith('data:'):
            continue
        # add loading lazy if not present
        if img.get('loading') is None:
            img['loading'] = 'lazy'
            changed = True

    if changed:
        # backup
        bak = path.with_suffix(path.suffix + '.bak')
        shutil.copy2(path, bak)
        path.write_text(str(soup), encoding='utf-8')
    return changed, len(imgs)


def generate_deploy_manifest(root: Path, out: Path):
    # include: all files under root except .git, .venv, tools (optional)
    includes = []
    for p in root.rglob('*'):
        if p.is_file():
            s = str(p)
            if '\\dist\\' in s or '\\.git\\' in s or '\\.venv\\' in s:
                continue
            # do not include the tools manifest itself
            if 'tools\\DEPLOY_MANIFEST.md' in s:
                continue
            includes.append(p.relative_to(root))

    with out.open('w', encoding='utf-8') as f:
        f.write('# 部署清单\n')
        f.write('\n')
        f.write('包含以下文件（相对于仓库根）：\n')
        f.write('\n')
        for p in sorted(includes):
            f.write('- ' + str(p).replace('\\\\', '/') + '\n')
        f.write('\n')
        f.write('排除： .git/, .venv/, dist/ (如只部署 dist 请仅上传 dist 内容)\n')
        f.write('\n')
        f.write('Cloudflare 建议：\n')
        f.write('- 启用 Brotli, Auto Minify (HTML/CSS/JS), Polish（视情况）\n')
        f.write('- Cache 静态资源为长缓存并使用版本化文件名\n')
        f.write('- 仅上传 dist/ 到 Cloudflare Pages 或其他静态主机\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='.', help='repo root')
    parser.add_argument('--manifest', default='tools/DEPLOY_MANIFEST.md', help='manifest output path')
    args = parser.parse_args()

    root = Path(args.root).resolve()
    modified_files = []
    total_imgs = 0

    htmls = [p for p in root.rglob('*.html') if '\\dist\\' not in str(p) and '\\.git\\' not in str(p) and '\\.venv\\' not in str(p)]
    for h in htmls:
        changed, imgcount = process_html(h)
        total_imgs += imgcount
        if changed:
            modified_files.append(h.relative_to(root))

    generate_deploy_manifest(root, Path(args.manifest))

    print(f'Modified {len(modified_files)} HTML files, total images found across files: {total_imgs}')
    if modified_files:
        print('Modified files:')
        for m in modified_files:
            print('-', m)


if __name__ == '__main__':
    main()
