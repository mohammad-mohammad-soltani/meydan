import { notFound } from "next/navigation";

/** The room itself is rendered by the shared chat layout so the list stays mounted while switching rooms. */
export default async function WorkPage({ params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  if (!/^\d{1,12}$/.test(workId)) notFound();
  return null;
}
