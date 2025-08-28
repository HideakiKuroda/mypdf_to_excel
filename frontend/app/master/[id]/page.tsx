import MasterPageClient from "@/components/masterTable/MasterPageClient";
import { MASTER_CONFIGS } from "@/components/masterTable/MasterConfigs";
import { notFound } from "next/navigation";

export const metadata = {
  title: "PDFTOEXCEL - マスター",
};

export function generateStaticParams() {
  return Object.keys(MASTER_CONFIGS).map((id) => ({ id }));
}

export default async function MasterPage({ params }: any) {
  const { id } = await params;
  const config = MASTER_CONFIGS[id];
  if (!config) return notFound();
  return <MasterPageClient config={config} />;
}
