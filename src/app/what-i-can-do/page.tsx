import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WhatICanDo, ServicesDetail } from "@/components/sections";

export const metadata: Metadata = {
  title: "What I Can Do — Websites, Google, Facebook, Design & Small Software",
  description: "Tell me what you want to do and I'll work out the technical part. Websites, online stores, Google and Facebook setup, logos and print, admin panels and small business software — for small businesses across India.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/what-i-can-do" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/what-i-can-do",
    title: "What I Can Do — Websites, Google, Facebook, Design & Small Software",
    description: "Tell me what you want to do and I'll work out the technical part. Websites, online stores, Google and Facebook setup, logos and print, admin panels and small business software — for small businesses across India.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "What I can do",
        "title": "Tell me the problem. I'll work out the technical part.",
        "intro": "Websites, online shops, Google and Facebook, logos and printing, admin panels and small business software. You do not need to know what any of it is called — describe what you want a customer to be able to do, and I will tell you what that takes.",
        "icon": "list_alt",
        "motif": [
          "language",
          "shopping_bag",
          "campaign",
          "palette",
          "database",
          "smartphone"
        ],
        "image": {
          "src": "/banners/kirana-shop.jpg",
          "alt": "A small Indian grocery shop, open and stocked, waiting for customers"
        }
      }}
      />
      <Breadcrumbs current="/what-i-can-do" />
      <WhatICanDo />
      <ServicesDetail />
    </>
  );
}
