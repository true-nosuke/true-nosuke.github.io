#!/usr/bin/env python3
from datetime import datetime
from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- ① AI にランダムテーマを作らせる ---
topic_prompt = """
AIに関するブログ記事のテーマを1つ、日本語で提案してください。
毎回異なるテーマで、SEO需要があるもの。
出力は1行のみ。
"""

topic_res = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": topic_prompt}],
    temperature=0.7,
    max_tokens=100
)
topic = topic_res.choices[0].message.content.strip()
print("Today's topic:", topic)

# --- ② そのテーマで記事を生成 ---
article_prompt = f"""
以下のテーマでSEO最適化されたブログ記事を日本語で書いてください。

テーマ：{topic}

Markdown形式で、タイトル, 導入, H2見出し構成, 本文, まとめ を含めてください。
"""

res = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": article_prompt}],
    temperature=0.7,
    max_tokens=4000
)
content = res.choices[0].message.content

# --- ③ ファイル保存 ---
date = datetime.now().strftime("%Y-%m-%d")
os.makedirs("_posts", exist_ok=True)
filename = f"_posts/{date}.md"

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Article generated: {filename}")
