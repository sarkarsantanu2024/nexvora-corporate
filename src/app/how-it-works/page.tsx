import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { HowItWorks, NoTechNeeded, MyPromise } from "@/components/sections";

export const metadata: Metadata = {
  title: "How It Works — Six Steps, and No Surprises on the Bill",
  description: "Message me on WhatsApp and agree the price before anything starts, then I keep you updated until it goes live. No technical knowledge needed, and everything ends up registered in your name.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/how-it-works" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/how-it-works",
    title: "How It Works — Six Steps, and No Surprises on the Bill",
    description: "Message me on WhatsApp and agree the price before anything starts, then I keep you updated until it goes live. No technical knowledge needed, and everything ends up registered in your name.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "How it works",
        "title": "From your first message to the day it goes live.",
        "intro": "Six steps, and you are told the price before any of them start. No technical document to prepare, no hourly meter, and no chasing me for an update — I will tell you when I start, when it is ready to look at, and when it is online.",
        "icon": "route",
        "motif": [
          "chat",
          "request_quote",
          "payments",
          "visibility",
          "rocket_launch",
          "notifications_active"
        ],
        "image": {
          "src": "/banners/boutique-staff.jpg",
          "alt": "A shop owner serving a customer in a small clothing store"
        }
      }}
      />
      <Breadcrumbs current="/how-it-works" />
      <HowItWorks />
      <NoTechNeeded />
      <MyPromise />
    </>
  );
}
