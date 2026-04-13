#!/usr/bin/env python3
"""
Weekly Design × AI Digest
Fetches RSS feeds, filters for design/AI content, publishes to Notion,
triggers a Vercel rebuild, and emails a digest.
"""

import feedparser
import requests
import resend
from datetime import datetime, timedelta, timezone
from time import mktime

import config


# ---------------------------------------------------------------------------
# Article fetching
# ---------------------------------------------------------------------------

def is_recent(entry, days: int) -> bool:
    """Return True if the entry was published within the last `days` days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    for date_field in ("published_parsed", "updated_parsed"):
        t = getattr(entry, date_field, None)
        if t:
            published = datetime.fromtimestamp(mktime(t), tz=timezone.utc)
            return published >= cutoff
    return True  # keep if we can't determine date


def matches_keywords(entry) -> bool:
    """Return True if title or summary contains at least one keyword."""
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
                        "title": getattr(entry, "title", "No title"),
                        "link":  getattr(entry, "link", "#"),
                        "summary": getattr(entry, "summary", "")[:300].strip(),
                    })
                    count += 1
        except Exception as e:
            print(f"[warn] Could not fetch {source_name}: {e}")
    return articles


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


def _article_blocks(articles: list[dict]) -> list[dict]:
    """Convert articles to Notion block objects, grouped by source."""
    blocks = []
    grouped: dict[str, list] = {}
    for a in articles:
        grouped.setdefault(a["source"], []).append(a)

    for source, items in grouped.items():
        # Section heading
        blocks.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": source}}]
            },
        })
        for item in items:
            # Article title as a linked paragraph
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": item["title"], "link": {"url": item["link"]}},
                            "annotations": {"bold": True},
                        }
                    ]
                },
            })
            if item["summary"]:
                summary_text = item["summary"]
                if not summary_text.endswith("…"):
                    summary_text += "…"
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": summary_text}}]
                    },
                })
            # Divider between articles
            blocks.append({"object": "block", "type": "divider", "divider": {}})

    return blocks


def publish_to_notion(title: str, articles: list[dict]) -> str:
    """Create a new digest page in Notion. Returns the page URL."""
    blocks = _article_blocks(articles)

    # Notion API allows max 100 children per request — split if needed
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

    # Append any remaining blocks (>100)
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
    """Hit the Vercel deploy hook to force a site rebuild."""
    if not config.VERCEL_DEPLOY_HOOK:
        print("[skip] VERCEL_DEPLOY_HOOK not set — skipping rebuild.")
        return
    resp = requests.post(config.VERCEL_DEPLOY_HOOK, timeout=15)
    resp.raise_for_status()
    print("Vercel rebuild triggered.")


# ---------------------------------------------------------------------------
# Email digest
# ---------------------------------------------------------------------------

def build_html(articles: list[dict]) -> str:
    today = datetime.now().strftime("%B %d, %Y")
    rows = ""
    if not articles:
        rows = "<p>No matching articles found this week.</p>"
    else:
        grouped: dict[str, list] = {}
        for a in articles:
            grouped.setdefault(a["source"], []).append(a)

        for source, items in grouped.items():
            rows += f"""
            <h2 style="color:#5046e5;margin-top:32px;margin-bottom:8px;font-size:16px;">
                {source}
            </h2>"""
            for item in items:
                summary = item["summary"].replace("<", "&lt;").replace(">", "&gt;")
                rows += f"""
            <div style="margin-bottom:20px;border-left:3px solid #e2e8f0;padding-left:12px;">
                <a href="{item['link']}" style="color:#1a202c;font-weight:600;text-decoration:none;font-size:15px;">
                    {item['title']}
                </a>
                <p style="color:#718096;font-size:13px;margin:4px 0 0;">{summary}…</p>
            </div>"""

    return f"""
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
             max-width:620px;margin:0 auto;padding:24px;background:#fff;color:#1a202c;">
  <div style="background:#5046e5;border-radius:8px;padding:24px 28px;margin-bottom:28px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Design &amp; AI Weekly</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">
        Week of {today} &nbsp;·&nbsp; {len(articles)} articles
    </p>
  </div>
  {rows}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
  <p style="color:#a0aec0;font-size:12px;">
      Fetched from {len(config.FEEDS)} sources · last {config.LOOKBACK_DAYS} days
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
    print(f"Found {len(articles)} articles.")

    date_str = datetime.now().strftime("%B %d, %Y")
    title = f"Design × AI Weekly Digest — {date_str}"

    print("Publishing to Notion…")
    publish_to_notion(title, articles)

    print("Triggering Vercel rebuild…")
    trigger_rebuild()

    print("Sending email digest…")
    html = build_html(articles)
    send_email(title, html)
    print(f"Digest sent to {config.EMAIL_RECIPIENT}.")


if __name__ == "__main__":
    main()
