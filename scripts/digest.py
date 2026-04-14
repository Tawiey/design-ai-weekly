#!/usr/bin/env python3
"""
Weekly Design × AI Digest
Fetches RSS feeds, curates with OpenAI, publishes to Notion,
triggers a Vercel rebuild, and emails a digest.
"""

import json
import feedparser
import requests
import resend
from html.parser import HTMLParser
from datetime import datetime, timedelta, timezone
from time import mktime
from openai import OpenAI

import config


# ---------------------------------------------------------------------------
# HTML stripping
# ---------------------------------------------------------------------------

class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str):
        self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(self._parts).strip()


def strip_html(text: str) -> str:
    """Remove all HTML tags and unescape entities, returning plain text."""
    if not text:
        return ""
    stripper = _HTMLStripper()
    stripper.feed(text)
    return " ".join(stripper.get_text().split())  # collapse whitespace


# ---------------------------------------------------------------------------
# Article fetching
# ---------------------------------------------------------------------------

def is_recent(entry, days: int) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    for date_field in ("published_parsed", "updated_parsed"):
        t = getattr(entry, date_field, None)
        if t:
            published = datetime.fromtimestamp(mktime(t), tz=timezone.utc)
            return published >= cutoff
    return True


def matches_keywords(entry) -> bool:
    text = " ".join([
        getattr(entry, "title", ""),
        getattr(entry, "summary", ""),
    ]).lower()
    return any(kw.lower() in text for kw in config.KEYWORDS)


def fetch_articles() -> list[dict]:
    articles = []
    for source_name, url in config.FEEDS:
        try:
            feed = feedparser.parse(url)
            count = 0
            for entry in feed.entries:
                if count >= config.MAX_PER_FEED:
                    break
                if is_recent(entry, config.LOOKBACK_DAYS) and matches_keywords(entry):
                    articles.append({
                        "source": source_name,
                        "title": strip_html(getattr(entry, "title", "No title")),
                        "link":  getattr(entry, "link", "#"),
                        "summary": strip_html(getattr(entry, "summary", ""))[:500],
                    })
                    count += 1
        except Exception as e:
            print(f"[warn] Could not fetch {source_name}: {e}")
    return articles


# ---------------------------------------------------------------------------
# AI curation
# ---------------------------------------------------------------------------

CURATION_PROMPT = """You are the editor of "Design × AI Weekly", a curated digest for product designers who care deeply about AI.

Below is a list of articles fetched from RSS feeds this week. Your job:
1. Select the 8–12 most insightful, relevant, or surprising articles. Drop anything generic, promotional, listicle-style, or thin on substance.
2. Group them into 2–4 meaningful themes that reflect what's happening in design and AI this week.
3. For each selected article write:
   - A clean 1–2 sentence summary (no HTML, no marketing fluff, factual)
   - A brief editor's take: why this matters, what's interesting, your opinion (1–2 sentences, opinionated and direct)
4. Write a 2–3 sentence intro for the whole digest that sets the week's context and tone.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "intro": "string",
  "themes": [
    {
      "name": "string",
      "articles": [
        {
          "title": "string",
          "link": "string",
          "source": "string",
          "summary": "string",
          "editors_take": "string"
        }
      ]
    }
  ]
}"""


def curate_with_ai(articles: list[dict]) -> dict:
    """Send raw articles to GPT-4o-mini for curation. Returns structured digest."""
    client = OpenAI(api_key=config.OPENAI_API_KEY)

    articles_text = json.dumps(
        [{"title": a["title"], "source": a["source"], "link": a["link"], "summary": a["summary"]}
         for a in articles],
        indent=2
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CURATION_PROMPT},
                {"role": "user", "content": f"Here are this week's articles:\n\n{articles_text}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        result = json.loads(response.choices[0].message.content)
        total = sum(len(t["articles"]) for t in result.get("themes", []))
        print(f"Curation complete. {total} articles across {len(result.get('themes', []))} themes.")
        return result
    except Exception as e:
        print(f"[warn] OpenAI curation failed: {e} — falling back to uncurated output.")
        return _fallback_digest(articles)


def _fallback_digest(articles: list[dict]) -> dict:
    """Minimal structure used if OpenAI call fails."""
    grouped: dict[str, list] = {}
    for a in articles:
        grouped.setdefault(a["source"], []).append(a)

    themes = [
        {
            "name": source,
            "articles": [
                {
                    "title": a["title"],
                    "link": a["link"],
                    "source": a["source"],
                    "summary": a["summary"],
                    "editors_take": "",
                }
                for a in items
            ],
        }
        for source, items in grouped.items()
    ]
    return {
        "intro": f"This week's design and AI digest — {datetime.now().strftime('%B %d, %Y')}.",
        "themes": themes,
    }


# ---------------------------------------------------------------------------
# Notion publishing
# ---------------------------------------------------------------------------

NOTION_API = "https://api.notion.com/v1"


def _notion_headers() -> dict:
    return {
        "Authorization": f"Bearer {config.NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }


def _digest_blocks(curated: dict) -> list[dict]:
    """Build Notion blocks from curated digest structure."""
    blocks: list[dict] = []

    # Intro callout
    if curated.get("intro"):
        blocks.append({
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": [{"type": "text", "text": {"content": curated["intro"]}}],
                "icon": {"type": "emoji", "emoji": "✦"},
                "color": "gray_background",
            },
        })

    for theme in curated.get("themes", []):
        blocks.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": theme["name"]}}],
            },
        })

        for article in theme.get("articles", []):
            # Bold linked title + source
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": article["title"], "link": {"url": article["link"]}},
                            "annotations": {"bold": True},
                        },
                        {
                            "type": "text",
                            "text": {"content": f"  —  {article['source']}"},
                            "annotations": {"color": "gray"},
                        },
                    ],
                },
            })

            # Summary
            if article.get("summary"):
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": article["summary"]}}],
                    },
                })

            # Editor's take
            if article.get("editors_take"):
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": f"Editor's take: {article['editors_take']}"},
                                "annotations": {"italic": True, "color": "brown"},
                            }
                        ],
                    },
                })

            blocks.append({"object": "block", "type": "divider", "divider": {}})

    return blocks


def publish_to_notion(title: str, curated: dict) -> str:
    """Create a new digest page in Notion. Returns the page URL."""
    blocks = _digest_blocks(curated)

    payload = {
        "parent": {"database_id": config.NOTION_DATABASE_ID},
        "properties": {
            "Name": {
                "title": [{"type": "text", "text": {"content": title}}]
            }
        },
        "children": blocks[:100],
    }

    resp = requests.post(
        f"{NOTION_API}/pages",
        headers=_notion_headers(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    page = resp.json()
    page_id = page["id"]

    remaining = blocks[100:]
    while remaining:
        chunk, remaining = remaining[:100], remaining[100:]
        r = requests.patch(
            f"{NOTION_API}/blocks/{page_id}/children",
            headers=_notion_headers(),
            json={"children": chunk},
            timeout=30,
        )
        r.raise_for_status()

    page_url = page.get("url", f"https://notion.so/{page_id.replace('-', '')}")
    print(f"Published to Notion: {page_url}")
    return page_url


# ---------------------------------------------------------------------------
# Vercel rebuild
# ---------------------------------------------------------------------------

def trigger_rebuild() -> None:
    if not config.VERCEL_DEPLOY_HOOK:
        print("[skip] VERCEL_DEPLOY_HOOK not set — skipping rebuild.")
        return
    resp = requests.post(config.VERCEL_DEPLOY_HOOK, timeout=15)
    resp.raise_for_status()
    print("Vercel rebuild triggered.")


# ---------------------------------------------------------------------------
# Email digest
# ---------------------------------------------------------------------------

def build_html(curated: dict, article_count: int) -> str:
    today = datetime.now().strftime("%B %d, %Y")
    sections = ""

    for theme in curated.get("themes", []):
        sections += f"""
        <h2 style="color:#5046e5;margin-top:36px;margin-bottom:12px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">
            {theme["name"]}
        </h2>"""

        for article in theme.get("articles", []):
            editors_take = ""
            if article.get("editors_take"):
                editors_take = f"""
                <p style="color:#92400e;font-size:13px;font-style:italic;margin:6px 0 0;padding:8px 10px;background:#fffbeb;border-radius:4px;">
                    ✦ {article["editors_take"]}
                </p>"""

            sections += f"""
        <div style="margin-bottom:24px;border-left:3px solid #e2e8f0;padding-left:14px;">
            <a href="{article['link']}" style="color:#1a202c;font-weight:600;text-decoration:none;font-size:15px;">
                {article['title']}
            </a>
            <span style="color:#a0aec0;font-size:12px;margin-left:8px;">{article['source']}</span>
            <p style="color:#4a5568;font-size:13px;margin:6px 0 0;line-height:1.5;">{article.get('summary', '')}</p>
            {editors_take}
        </div>"""

    intro_html = ""
    if curated.get("intro"):
        intro_html = f"""
    <p style="color:#4a5568;font-size:15px;line-height:1.6;margin-bottom:28px;padding:16px;background:#f7fafc;border-radius:6px;border-left:3px solid #5046e5;">
        {curated["intro"]}
    </p>"""

    return f"""
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
             max-width:620px;margin:0 auto;padding:24px;background:#fff;color:#1a202c;">
  <div style="background:#5046e5;border-radius:8px;padding:24px 28px;margin-bottom:28px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Design × AI Weekly</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">
        Week of {today} &nbsp;·&nbsp; {article_count} articles
    </p>
  </div>
  {intro_html}
  {sections}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
  <p style="color:#a0aec0;font-size:12px;">
      Curated from {len(config.FEEDS)} sources · last {config.LOOKBACK_DAYS} days
  </p>
</body>
</html>"""


def send_email(subject: str, html: str) -> None:
    resend.api_key = config.RESEND_API_KEY
    resend.Emails.send({
        "from": config.EMAIL_FROM,
        "to": config.EMAIL_RECIPIENT,
        "subject": subject,
        "html": html,
    })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Fetching RSS articles…")
    articles = fetch_articles()
    print(f"Found {len(articles)} candidate articles.")

    print("Curating with OpenAI…")
    curated = curate_with_ai(articles)

    date_str = datetime.now().strftime("%B %d, %Y")
    title = f"Design × AI Weekly Digest — {date_str}"
    article_count = sum(len(t["articles"]) for t in curated.get("themes", []))

    print("Publishing to Notion…")
    publish_to_notion(title, curated)

    print("Triggering Vercel rebuild…")
    trigger_rebuild()

    print("Sending email digest…")
    html = build_html(curated, article_count)
    send_email(title, html)
    print(f"Digest sent to {config.EMAIL_RECIPIENT}.")


if __name__ == "__main__":
    main()
