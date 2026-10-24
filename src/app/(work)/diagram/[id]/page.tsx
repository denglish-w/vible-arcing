import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { WorkPlaceholder } from "@/components/work/work-placeholder";
import { appDb, getWork } from "@/db/server";

export const metadata: Metadata = { title: "Diagram" };

export default async function DiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const record = getWork(await appDb(), "diagram", (await params).id);
  if (!record) notFound();
  return <WorkPlaceholder item={record} />;
}
