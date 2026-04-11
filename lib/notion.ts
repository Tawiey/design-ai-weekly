import { slugify, formatDate } from "./utils";

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const DATABASE_ID = process.env.NOTION_DIGEST_DB!;

const headers = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function notionFetch(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export type Digest = {
  id: string;
  title: string;
  slug: string;
  date: string;
  dateFormatted: string;
};

type NotionRichText = {
  plain_text: string;
  type: string;
  text?: { content: string; link?: { url: string } | null };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
};

type NotionPage = {
  id: string;
  created_time: string;
  properties: {
    Name: {
      type: "title";
      title: NotionRichText[];
    };
  };
};

export type NotionBlock = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export async function getAllDigests(): Promise<Digest[]> {
  const data = await notionFetch(`/databases/${DATABASE_ID}/query`, {
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return (data.results as NotionPage[]).map((page) => {
    const title = page.properties.Name.title
      .map((t) => t.plain_text)
      .join("");

    return {
      id: page.id,
      title,
      slug: slugify(title),
      date: page.created_time,
      dateFormatted: formatDate(page.created_time),
    };
  });
}

export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (cursor) params.set("start_cursor", cursor);

    const data = await notionFetch(
      `/blocks/${pageId}/children?${params.toString()}`
    );

    blocks.push(...(data.results as NotionBlock[]));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

export async function getDigestBySlug(slug: string) {
  const digests = await getAllDigests();
  const digest = digests.find((d) => d.slug === slug);
  if (!digest) return null;

  const blocks = await getPageBlocks(digest.id);
  return { ...digest, blocks };
}
