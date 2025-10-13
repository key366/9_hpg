# -*- coding: utf-8 -*-
"""
    完成  10.TK窗口替换格理特图标(技术有限,打包不进去); EXE执行程序上替换格理特图标
    99. 打包程序,测试其他软件兼容性;
    pyinstaller -w -p venv\Lib\site-packages -F 层级调整测试V4.py -i greatech1.ico  -n FMS8000工具
    199. 打包程序,测试其他软件兼容性;
    pyinstaller -w fur_pptpixpin_long.py -n 多图片合并为长图

    pyinstaller --onefile fur_pptpixpin_long.py
"""

import tkinter as tk
from tkinter import filedialog, messagebox
import markdown
import os


def convert_md_to_html():
    # 创建文件选择对话框
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(
        title="选择Markdown文件",
        filetypes=[("Markdown文件", "*.md"), ("所有文件", "*.*")]
    )

    if not file_path:
        return

    try:
        # 读取Markdown文件
        with open(file_path, 'r', encoding='utf-8') as md_file:
            md_content = md_file.read()

        # 转换Markdown为HTML
        html_content = markdown.markdown(
            md_content,
            extensions=['toc', 'extra', 'tables', 'fenced_code']
        )

        # 添加完整HTML结构
        full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{os.path.basename(file_path)}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }}
        pre {{ background: #f4f4f4; padding: 10px; overflow-x: auto; }}
        code {{ background: #f4f4f4; padding: 2px 5px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""

        # 保存HTML文件
        output_path = os.path.splitext(file_path)[0] + '_md.html'
        with open(output_path, 'w', encoding='utf-8') as html_file:
            html_file.write(full_html)

        messagebox.showinfo(
            "转换成功",
            f"文件已保存为:\n{output_path}"
        )
    except Exception as e:
        messagebox.showerror(
            "转换失败",
            f"发生错误:\n{str(e)}"
        )


if __name__ == "__main__":
    convert_md_to_html()
