import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Founder, WhyIStarted, NotRightForYou } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Me — Santanu Sarkar, the Person Who Does the Work",
  description: "Nexvora is a small technology business in Kolkata, run by Santanu Sarkar, who has 13+ years of hands-on web development experience. No account manager in the middle — you deal with the person doing the work.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/about" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/about",
    title: "About Me — Santanu Sarkar, the Person Who Does the Work",
    description: "Nexvora is a small technology business in Kolkata, run by Santanu Sarkar, who has 13+ years of hands-on web development experience. No account manager in the middle — you deal with the person doing the work.",
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
        "intro": "I am Santanu Sarkar. Nexvora is mine, it is based in Kolkata, and there is no account manager in the middle. I have 13+ years of hands-on web development experience. I do the work myself and bring in another pair of hands only when a job genuinely needs one — either way you deal with me.",
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
