import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LegalDocument } from "@/components/legal-document";
import { legalDoc, legalMetadata } from "@/lib/legal";

const DOC = legalDoc("/refunds");

export const metadata: Metadata = legalMetadata("/refunds");

export default function Page() {
  return (
    <>
      <PageBanner
        eyebrow={DOC.eyebrow}
        title={DOC.title}
        intro={DOC.intro}
        icon={DOC.icon}
        motif={DOC.motif}
      />
      <Breadcrumbs current="/refunds" />
      <LegalDocument doc={DOC} />
    </>
  );
}
