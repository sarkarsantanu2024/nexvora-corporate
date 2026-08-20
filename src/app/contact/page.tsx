import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Contact } from "@/components/sections";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact — Message Me on WhatsApp",
  description: "WhatsApp +91 98042 43159, call, or email. Text, a photograph or a voice note is enough to start. Office in Kolkata, and I travel across India when a job needs it.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/contact" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/contact",
    title: "Contact — Message Me on WhatsApp",
    description: "WhatsApp +91 98042 43159, call, or email. Text, a photograph or a voice note is enough to start. Office in Kolkata, and I travel across India when a job needs it.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "Contact",
        "title": "Send me a message. That is genuinely enough to start.",
        "intro": "Text, a photograph of something you wrote on paper, or a voice note in Bengali, Hindi or English. I reply the same working day. My office is in Kolkata, and I travel across India when a job needs it.",
        "icon": "chat",
        "motif": [
          "call",
          "mail",
          "location_on",
          "videocam",
          "schedule",
          "flight_takeoff"
        ],
        "image": {
          "src": "/banners/bazaar-street.jpg",
          "alt": "A street of small shops in an Indian bazaar"
        }
      }}
      />
      <Breadcrumbs current="/contact" />
      <ContactForm />
      <Contact />
    </>
  );
}
