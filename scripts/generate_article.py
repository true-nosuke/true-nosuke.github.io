#!/usr/bin/env python3
from datetime import datetime
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

# --- ① AI にランダムテーマを作らせる ---
topic_prompt = """
AIに関するブログ記事のテーマを1つ、日本語で提案してください。
毎回異なるテーマで、SEO需要があるもの。
出力は1行のみ。
"""

topic_res = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": topic_prompt}]
)

topic = topic_res["choices"][0]["message"]["content"]
print("Today's topic:", topic)

# --- ② そのテーマで記事を生成 ---
article_prompt = f"""
以下のテーマでSEO最適化されたブログ記事を日本語で書いてください。

テーマ：{topic}

Markdown形式で、タイトル, 導入, H2見出し構成, 本文, まとめ を含めてください。
"""

res = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": article_prompt}]
)

content = res["choices"][0]["message"]["content"]

# --- ③ ファイル保存 ---
date = datetime.now().strftime("%Y-%m-%d")
os.makedirs("posts", exist_ok=True)
filename = f"posts/{date}.md"

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Article generated: {filename}")
