import { getAllDigests } from "@/lib/notion";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage() {
  const digests = await getAllDigests();

  if (digests.length === 0) {
    return (
      <p className="text-neutral-500 text-center py-20">
        No digests yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {digests.map((digest) => (
        <Link
          key={digest.id}
          href={`/digest/${digest.slug}`}
          className="group block py-4 -mx-3 px-3 rounded-lg transition-colors hover:bg-neutral-900"
        >
          <h2 className="text-base font-medium text-neutral-100 group-hover:text-indigo-400 transition-colors">
            {digest.title}
          </h2>
          <time className="text-sm text-neutral-500 font-mono mt-1 block">
            {digest.dateFormatted}
          </time>
        </Link>
      ))}
    </div>
  );
}
