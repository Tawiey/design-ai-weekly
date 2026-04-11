import { getAllDigests } from "@/lib/notion";
import { Hero } from "@/components/hero";

export const revalidate = 3600;

export default async function HomePage() {
  const digests = await getAllDigests();

  const digestCards = digests.map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    dateFormatted: d.dateFormatted,
  }));

  return <Hero digests={digestCards} />;
}
