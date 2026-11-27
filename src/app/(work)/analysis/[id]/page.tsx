import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { WorkPlaceholder } from "../../../../components/work/work-placeholder";
import { StoreUnavailable } from "../../../../components/work/store-unavailable";
import {
  appDb,
  getWork,
  isStoreUnavailable,
  type WorkRecord,
} from "../../../../db/server";

export const metadata: Metadata = { title: "Analysis" };

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  let record: WorkRecord | undefined;
  try {
    record = getWork(await appDb(), "analysis", (await params).id);
  } catch (error) {
    if (isStoreUnavailable(error)) return <StoreUnavailable error={error} />;
    throw error;
  }
  if (!record) notFound();
  return <WorkPlaceholder item={record} />;
}
