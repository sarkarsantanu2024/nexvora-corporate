import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Demos } from "@/components/sections";

export const metadata: Metadata = {
  title: "Demos — Sample Websites for Shops, Clinics, Coaching Centres and More",
  description: "Fifteen sample websites you can open on your phone: a sweet shop, a saree shop, a doctor's clinic, a beauty parlour, a gym, a Kumartuli idol maker, a coaching centre, a play school and more. Pick the one closest to your business and ask for yours.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/demos" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/demos",
    title: "Demos — Sample Websites for Shops, Clinics, Coaching Centres and More",
    description: "Fifteen sample websites you can open on your phone: a sweet shop, a saree shop, a doctor's clinic, a beauty parlour, a gym, a Kumartuli idol maker, a coaching centre, a play school and more. Pick the one closest to your business and ask for yours.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "Demos",
        "title": "See what your website could look like before you spend a rupee.",
        "intro": "Fifteen sample websites, one for each kind of business I am usually asked about. Open the one closest to yours on your phone. The shops and the people in them are made up — the design, the sections and the speed are exactly what you would get, with your own name, photographs and prices.",
        "icon": "web",
        "motif": [
          "storefront",
          "stethoscope",
          "school",
          "checkroom",
          "palette",
          "child_care"
        ],
        "image": {
          "src": "/demo/sweets/images/hero.jpg",
          "alt": "A sample sweet shop website, one of the demos"
        }
      }}
      />
      <Breadcrumbs current="/demos" />
      <Demos />
    </>
  );
}
