#!/usr/bin/env python3
from datetime import datetime
from groq import Groq
import os
import re
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- ① AI にランダムテーマを作らせる ---
topic_prompt = """
AIに関するブログ記事のテーマを1つ、日本語で提案してください。
毎回異なるテーマで、SEO需要があるもの。
出力は1行のみ。タイトルのみを出力してください。
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

Markdown形式で、H2見出し構成, 本文, まとめ を含めてください。
タイトル（# {topic}）は含めないでください。
"""

res = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": article_prompt}],
    temperature=0.7,
    max_tokens=4000
)
content = res.choices[0].message.content

# --- ③ カテゴリ・タグ・ファイル名を自動生成 ---
metadata_prompt = f"""
以下のブログ記事タイトルに基づいて、適切なメタデータをJSON形式で生成してください。

タイトル: {topic}

以下の形式で出力してください（JSONのみ、説明不要）:
{{
  "categories": ["カテゴリ1", "カテゴリ2"],
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "slug": "英数字とハイフンのみのURL用スラッグ（50文字以内）"
}}

- categories: 2つの適切なカテゴリ（例: tech, AI, マーケティング, プログラミング など）
- tags: 5つの関連タグ（具体的で検索されやすいもの）
- slug: 英語のURL用スラッグ（例: ai-marketing-strategy）
"""

metadata_res = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": metadata_prompt}],
    temperature=0.5,
    max_tokens=200
)

# JSONをパース（エラー時はデフォルト値）
try:
    metadata_text = metadata_res.choices[0].message.content.strip()
    # JSON部分のみを抽出（```json ... ``` で囲まれている場合も対応）
    if "```json" in metadata_text:
        metadata_text = metadata_text.split("```json")[1].split("```")[0].strip()
    elif "```" in metadata_text:
        metadata_text = metadata_text.split("```")[1].split("```")[0].strip()
    
    metadata = json.loads(metadata_text)
    categories = metadata.get("categories", ["tech", "AI"])
    tags = metadata.get("tags", ["AI", "技術", "プログラミング"])
    topic_slug = metadata.get("slug", re.sub(r'[^\w\s-]', '', topic).strip().replace(' ', '-')[:50])
except Exception as e:
    print(f"Metadata parsing error: {e}")
    # デフォルト値
    categories = ["tech", "AI"]
    tags = ["AI", "技術", "プログラミング"]
    topic_slug = re.sub(r'[^\w\s-]', '', topic).strip().replace(' ', '-')[:50]

print(f"Categories: {categories}")
print(f"Tags: {tags}")
print(f"Slug: {topic_slug}")

# --- ④ Jekyll用Front Matterとファイル保存 ---
now = datetime.now()
date_str = now.strftime("%Y-%m-%d")
datetime_str = now.strftime("%Y-%m-%d %H:%M:%S +0900")

# Jekyll Front Matter
front_matter = f"""---
layout: post
title: "{topic}"
date: {datetime_str}
categories: {categories}
tags: {tags}
---

"""

# ファイル名: YYYY-MM-DD-スラッグ.md
os.makedirs("_posts", exist_ok=True)
filename = f"_posts/{date_str}-{topic_slug}.md"

# Front Matter + 記事内容を保存
with open(filename, "w", encoding="utf-8") as f:
    f.write(front_matter)
    f.write(content)

print(f"Article generated: {filename}")
