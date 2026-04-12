import { getAllDigests, getDigestBySlug } from "@/lib/notion";
import { NotionBlocks } from "@/lib/blocks";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const digests = await getAllDigests();
  return digests.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const digest = await getDigestBySlug(slug);
  if (!digest) return { title: "Not Found" };
  return {
    title: digest.title,
    description: `Design × AI Weekly Digest — ${digest.dateFormatted}`,
  };
}

export default async function DigestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const digest = await getDigestBySlug(slug);

  if (!digest) {
    notFound();
  }

  return (
    <article className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 inline-block"
      >
        &larr; All digests
      </Link>

      <header className="mb-8">
        <time className="text-sm text-neutral-500 font-mono block mb-2">
          {digest.dateFormatted}
        </time>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
          {digest.title}
        </h1>
      </header>

      <div className="digest-content">
        <NotionBlocks blocks={digest.blocks} skipFirstHeading />
      </div>
    </article>
  );
}
