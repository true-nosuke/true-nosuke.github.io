#!/usr/bin/env python3
from datetime import datetime
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# --- ① AI にランダムテーマを作らせる ---
topic_prompt = """
AIに関するブログ記事のテーマを1つ、日本語で提案してください。
毎回異なるテーマで、SEO需要があるもの。
出力は1行のみ。
"""

topic_res = model.generate_content(topic_prompt)
topic = topic_res.text.strip()
print("Today's topic:", topic)

# --- ② そのテーマで記事を生成 ---
article_prompt = f"""
以下のテーマでSEO最適化されたブログ記事を日本語で書いてください。

テーマ：{topic}

Markdown形式で、タイトル, 導入, H2見出し構成, 本文, まとめ を含めてください。
"""

res = model.generate_content(article_prompt)
content = res.text

# --- ③ ファイル保存 ---
date = datetime.now().strftime("%Y-%m-%d")
os.makedirs("_posts", exist_ok=True)
filename = f"_posts/{date}.md"

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Article generated: {filename}")
