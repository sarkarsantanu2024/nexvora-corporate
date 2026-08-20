import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Founder, WhyIStarted, NotRightForYou } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Me — Santanu Sarkar, the Person Who Does the Work",
  description: "Nexvora is a one-person technology business in Kolkata. Thirteen years building for the web, no account manager in the middle, and I will travel anywhere in India if the job needs it.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/about" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/about",
    title: "About Me — Santanu Sarkar, the Person Who Does the Work",
    description: "Nexvora is a one-person technology business in Kolkata. Thirteen years building for the web, no account manager in the middle, and I will travel anywhere in India if the job needs it.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "About me",
        "title": "You will be dealing with the person who does the work.",
        "intro": "I am Santanu Sarkar. Nexvora is mine, it is based in Kolkata, and there is no account manager in the middle. Thirteen years building for the web, and I will travel anywhere in India when a job genuinely needs me there.",
        "icon": "person",
        "motif": [
          "code",
          "handshake",
          "flight_takeoff",
          "verified_user",
          "call",
          "location_on"
        ],
        "image": {
          "src": "/santanu-sarkar.jpg",
          "alt": "Santanu Sarkar, founder of Nexvora Technologies"
        }
      }}
      />
      <Breadcrumbs current="/about" />
      <Founder />
      <WhyIStarted />
      <NotRightForYou />
    </>
  );
}
