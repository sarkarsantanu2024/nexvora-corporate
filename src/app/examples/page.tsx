import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Examples, Products } from "@/components/sections";

export const metadata: Metadata = {
  title: "Examples — Software and Websites I Have Actually Built",
  description: "Screenshots of real software running right now, with real people using it: EduFlow coaching management, SocialPilot AI, Dekhao Apna Talent, and websites built for clients.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/examples" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/examples",
    title: "Examples — Software and Websites I Have Actually Built",
    description: "Screenshots of real software running right now, with real people using it: EduFlow coaching management, SocialPilot AI, Dekhao Apna Talent, and websites built for clients.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "Examples",
        "title": "Software that is running right now, with real people using it.",
        "intro": "Not mock-ups, not template previews, not somebody else's portfolio. These are screenshots of things I built and still run. Open any of them and judge for yourself before you spend a rupee.",
        "icon": "photo_library",
        "motif": [
          "school",
          "campaign",
          "star",
          "print",
          "health_and_safety",
          "forum"
        ],
        "image": {
          "src": "/work/eduflow.png",
          "alt": "EduFlow, coaching centre management software built by Nexvora Technologies"
        }
      }}
      />
      <Breadcrumbs current="/examples" />
      <Examples />
      <Products />
    </>
  );
}
