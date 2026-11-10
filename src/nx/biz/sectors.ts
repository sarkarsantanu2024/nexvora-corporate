// What the business dashboard calls things, per kind of business. The same
// modules wear different words: a coaching centre has students and fees, a
// shop has customers and bills, a clinic has patients and consultation fees.
import { DEMOS } from "@/lib/demos";
import type { Bilingual } from "../types";

export type SectorKey = "classes" | "fitness" | "health" | "shop" | "events" | "services";

export type Sector = {
  key: SectorKey;
  /** The people the business earns from. */
  people: Bilingual;
  person: Bilingual;
  /** What a person pays. */
  money: Bilingual;
  /** The recurring charge, if the business bills monthly. */
  monthly: boolean;
  /** What the items module is called, or null if the business has no stock. */
  items: Bilingual | null;
  /** Groups people belong to: batches, plans, none. */
  group: Bilingual | null;
  groups: string[];
  feeRange: [number, number];
  expenseCategories: Bilingual[];
};

const C = (en: string, bn: string): Bilingual => ({ en, bn });

export const SECTORS: Record<SectorKey, Sector> = {
  classes: {
    key: "classes",
    people: C("Students", "ছাত্রছাত্রী"),
    person: C("Student", "ছাত্র/ছাত্রী"),
    money: C("Fees", "ফি"),
    monthly: true,
    items: null,
    group: C("Batch", "ব্যাচ"),
    groups: ["Morning 7 am", "Evening 5 pm", "Evening 6:30 pm", "Weekend"],
    feeRange: [500, 1500],
    expenseCategories: [C("Rent", "ভাড়া"), C("Teacher salary", "শিক্ষকের বেতন"), C("Electricity", "বিদ্যুৎ"), C("Materials", "সামগ্রী"), C("Advertising", "বিজ্ঞাপন")],
  },
  fitness: {
    key: "fitness",
    people: C("Members", "সদস্য"),
    person: C("Member", "সদস্য"),
    money: C("Membership", "সদস্যপদ ফি"),
    monthly: true,
    items: C("Supplements and gear", "সাপ্লিমেন্ট ও সরঞ্জাম"),
    group: C("Plan", "প্ল্যান"),
    groups: ["Monthly", "Quarterly", "Yearly", "Women's hour"],
    feeRange: [800, 2500],
    expenseCategories: [C("Rent", "ভাড়া"), C("Trainer salary", "ট্রেনারের বেতন"), C("Electricity", "বিদ্যুৎ"), C("Equipment", "যন্ত্রপাতি"), C("Cleaning", "পরিষ্কার")],
  },
  health: {
    key: "health",
    people: C("Patients", "রোগী"),
    person: C("Patient", "রোগী"),
    money: C("Bills", "বিল"),
    monthly: false,
    items: C("Medicines and supplies", "ওষুধ ও সামগ্রী"),
    group: C("Doctor", "ডাক্তার"),
    groups: ["Dr. Mukherjee", "Dr. Sen", "Lab"],
    feeRange: [300, 1500],
    expenseCategories: [C("Rent", "ভাড়া"), C("Staff salary", "কর্মীদের বেতন"), C("Medicines", "ওষুধ"), C("Electricity", "বিদ্যুৎ"), C("Lab reagents", "ল্যাব সামগ্রী")],
  },
  shop: {
    key: "shop",
    people: C("Customers", "গ্রাহক"),
    person: C("Customer", "গ্রাহক"),
    money: C("Bills", "বিল"),
    monthly: false,
    items: C("Items and stock", "জিনিস ও স্টক"),
    group: null,
    groups: [],
    feeRange: [200, 3000],
    expenseCategories: [C("Rent", "ভাড়া"), C("Purchases", "কেনাকাটা"), C("Staff salary", "কর্মীদের বেতন"), C("Electricity", "বিদ্যুৎ"), C("Transport", "পরিবহন")],
  },
  events: {
    key: "events",
    people: C("Customers", "গ্রাহক"),
    person: C("Customer", "গ্রাহক"),
    money: C("Bookings", "বুকিং"),
    monthly: false,
    items: C("Packages and stock", "প্যাকেজ ও স্টক"),
    group: C("Event type", "অনুষ্ঠানের ধরন"),
    groups: ["Wedding", "Birthday", "Puja", "Corporate"],
    feeRange: [2000, 25000],
    expenseCategories: [C("Raw materials", "কাঁচামাল"), C("Staff wages", "কর্মীদের মজুরি"), C("Transport", "পরিবহন"), C("Rent", "ভাড়া"), C("Advertising", "বিজ্ঞাপন")],
  },
  services: {
    key: "services",
    people: C("Clients", "ক্লায়েন্ট"),
    person: C("Client", "ক্লায়েন্ট"),
    money: C("Fees", "ফি"),
    monthly: false,
    items: null,
    group: C("Case or job", "কেস বা কাজ"),
    groups: ["New", "In progress", "Waiting for client", "Done"],
    feeRange: [1000, 15000],
    expenseCategories: [C("Office rent", "অফিস ভাড়া"), C("Staff salary", "কর্মীদের বেতন"), C("Government fees", "সরকারি ফি"), C("Travel", "যাতায়াত"), C("Printing", "প্রিন্টিং")],
  },
};

const GROUP_TO_SECTOR: Record<string, SectorKey> = {
  "Classes and schools": "classes",
  "Fitness and beauty": "fitness",
  Health: "health",
  Shops: "shop",
  "Food and events": "events",
  "Services and trades": "services",
};

export function sectorForSite(site: string): Sector {
  const demo = DEMOS.find((d) => d.slug === site);
  const key = demo ? GROUP_TO_SECTOR[demo.group] ?? "shop" : "shop";
  // Salons bill per visit, not monthly, even though they sit with fitness.
  if (site === "salon") return { ...SECTORS.fitness, monthly: false, people: C("Customers", "গ্রাহক"), person: C("Customer", "গ্রাহক"), money: C("Bills", "বিল"), group: null, groups: [], items: C("Products", "পণ্য") };
  return SECTORS[key];
}
