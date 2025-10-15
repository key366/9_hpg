站点优化工具说明

简介
----
该工具把当前静态站点复制到 `dist/`，并执行以下优化：

- HTML/CSS/JS 最小化
- 可选将 JPG/PNG 转为 WebP（默认开启）

使用方法
----
1. 创建并激活 Python 虚拟环境：

   在 PowerShell 中：

   ```powershell
   python -m venv .venv; .\.venv\Scripts\Activate.ps1
   pip install -r tools/requirements.txt
   python tools/optimize_site.py --src . --out dist
   ```

2. 如果不希望转换图片，添加 `--no-convert`。

Cloudflare 上的推荐设置
----
- 启用 Brotli 压缩
- 启用自动最小化（Auto Minify）中的 HTML、CSS、JS
- 使用 Cache Rules 缓存静态内容较长时间（例如 max-age=31536000）并使用版本化文件名
- 启用 Polish（有损/无损压缩）并转换图像为 WebP（若可用）

后续可选优化
----
- 懒加载图片（loading="lazy"），并按屏幕分辨率生成不同尺寸的图片（srcset）
- 合并/移除未使用的 CSS（需要分析工具）
- 将第三方脚本（如 polyfills）延迟或按需加载
