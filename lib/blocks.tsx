import type { NotionBlock } from "./notion";
import React from "react";

type RichTextSegment = {
  type: string;
  plain_text: string;
  text?: { content: string; link?: { url: string } | null };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
  };
};

function renderRichText(richText: RichTextSegment[]): React.ReactNode[] {
  return richText.map((segment, i) => {
    let node: React.ReactNode = segment.plain_text;

    if (segment.annotations?.bold) {
      node = <strong key={`b-${i}`}>{node}</strong>;
    }
    if (segment.annotations?.italic) {
      node = <em key={`i-${i}`}>{node}</em>;
    }
    if (segment.text?.link) {
      node = (
        <a
          key={`a-${i}`}
          href={segment.text.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline"
        >
          {node}
        </a>
      );
    }

    if (typeof node === "string") {
      return <React.Fragment key={i}>{node}</React.Fragment>;
    }

    return node;
  });
}

function getRichText(block: NotionBlock): RichTextSegment[] {
  const data = block[block.type] as { rich_text?: RichTextSegment[] } | undefined;
  return data?.rich_text ?? [];
}

function renderBlock(block: NotionBlock): React.ReactNode {
  const richText = getRichText(block);

  switch (block.type) {
    case "heading_1":
      return (
        <h2 key={block.id} className="text-2xl font-bold mt-10 mb-4 text-neutral-50">
          {renderRichText(richText)}
        </h2>
      );
    case "heading_2":
      return (
        <h3 key={block.id} className="text-xl font-semibold mt-8 mb-3 text-neutral-100">
          {renderRichText(richText)}
        </h3>
      );
    case "heading_3":
      return (
        <h4 key={block.id} className="text-lg font-medium mt-6 mb-2 text-neutral-200">
          {renderRichText(richText)}
        </h4>
      );
    case "paragraph":
      if (richText.length === 0) {
        return <div key={block.id} className="h-4" />;
      }
      return (
        <p key={block.id} className="mb-4 leading-7 text-neutral-300">
          {renderRichText(richText)}
        </p>
      );
    case "bulleted_list_item":
      return <li key={block.id}>{renderRichText(richText)}</li>;
    case "numbered_list_item":
      return <li key={block.id}>{renderRichText(richText)}</li>;
    case "divider":
      return <hr key={block.id} className="my-8 border-neutral-800" />;
    default:
      return null;
  }
}

export function NotionBlocks({
  blocks,
  skipFirstHeading = false,
}: {
  blocks: NotionBlock[];
  skipFirstHeading?: boolean;
}) {
  const elements: React.ReactNode[] = [];
  let i = 0;
  let skippedHeading = false;

  while (i < blocks.length) {
    const block = blocks[i];

    // Skip the first heading_1 (it's the page title, already shown in the page header)
    if (skipFirstHeading && !skippedHeading && block.type === "heading_1") {
      skippedHeading = true;
      i++;
      continue;
    }

    if (block.type === "bulleted_list_item") {
      const items: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      elements.push(
        <ul key={`ul-${block.id}`} className="list-disc pl-6 mb-4 space-y-1 text-neutral-300">
          {items}
        </ul>
      );
      continue;
    }

    if (block.type === "numbered_list_item") {
      const items: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      elements.push(
        <ol key={`ol-${block.id}`} className="list-decimal pl-6 mb-4 space-y-1 text-neutral-300">
          {items}
        </ol>
      );
      continue;
    }

    elements.push(renderBlock(block));
    i++;
  }

  return <>{elements}</>;
}
