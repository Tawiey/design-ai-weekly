import os

# Resend email settings
RESEND_API_KEY  = os.environ["RESEND_API_KEY"]
EMAIL_FROM      = os.environ["EMAIL_FROM"]       # e.g. "Design × AI Weekly <digest@yourdomain.com>"
EMAIL_RECIPIENT = os.environ["EMAIL_RECIPIENT"]  # where the digest gets delivered

# Notion integration
NOTION_TOKEN       = os.environ["NOTION_TOKEN"]
NOTION_DATABASE_ID = os.environ["NOTION_DATABASE_ID"]

# Vercel deploy hook URL — create at: Vercel project → Settings → Git → Deploy Hooks
VERCEL_DEPLOY_HOOK = os.environ.get("VERCEL_DEPLOY_HOOK", "")

# RSS feeds to pull from — add/remove as you like
FEEDS = [
    # Design-focused
    ("UX Collective",        "https://uxdesign.cc/feed"),
    ("Nielsen Norman Group", "https://www.nngroup.com/feed/rss/"),
    ("Smashing Magazine",    "https://www.smashingmagazine.com/feed/"),
    ("Designer News",        "https://www.designernews.co/stories.rss"),
    # AI-focused
    ("MIT Tech Review AI",   "https://www.technologyreview.com/topic/artificial-intelligence/feed/"),
    ("The Verge AI",         "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml"),
    ("VentureBeat AI",       "https://venturebeat.com/category/ai/feed/"),
]

# Keywords to keep an article (case-insensitive). At least one must match.
KEYWORDS = [
    "AI", "artificial intelligence", "machine learning", "generative",
    "design tool", "Figma", "design system", "UX", "UI", "LLM",
    "diffusion", "midjourney", "stable diffusion", "GPT", "copilot",
]

# How many days back to look for articles
LOOKBACK_DAYS = 7

# Max articles per feed
MAX_PER_FEED = 5
