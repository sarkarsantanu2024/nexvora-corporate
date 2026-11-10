// The business records behind the dashboard, and the sample data the demo
// starts with. In the demo everything lives in the visitor's browser. The
// same shapes go into Neon for a real client.
import type { Sector } from "./sectors";

export type Person = {
  id: string;
  name: string;
  phone: string;
  group: string;
  /** Monthly fee, or the usual bill, in rupees. */
  fee: number;
  joined: string; // YYYY-MM-DD
  active: boolean;
  note?: string;
};

export type Due = {
  id: string;
  personId: string;
  title: string;
  period: string; // YYYY-MM
  amount: number;
  paid: number;
  dueDate: string;
};

export type Payment = {
  id: string;
  personId: string;
  dueId?: string;
  amount: number;
  method: "upi" | "cash" | "bank";
  date: string; // YYYY-MM-DD
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
};

export type Item = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock: number;
};

export type Staff = {
  id: string;
  name: string;
  phone: string;
  role: string;
  canSee: string[];
};

export type BizData = {
  version: number;
  business: { name: string; upi: string; plan: "self" | "business" };
  people: Person[];
  dues: Due[];
  payments: Payment[];
  expenses: Expense[];
  items: Item[];
  staff: Staff[];
};

export const DATA_VERSION = 1;

// Deterministic pseudo-random numbers from a string, so a demo always shows
// the same sample data and a screenshot can be reproduced.
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const FIRST = ["Anindita", "Sourav", "Priya", "Rahul", "Moumita", "Arijit", "Sneha", "Debashis", "Ritika", "Koushik", "Tanushree", "Subhajit", "Payel", "Sayan", "Ipsita", "Abhishek", "Rimi", "Pritam", "Shreya", "Avik", "Nandini", "Soumen", "Madhurima", "Dipankar", "Rupsa", "Biswajit", "Ankita", "Tamal", "Sohini", "Rajdeep"];
const LAST = ["Das", "Mukherjee", "Sen", "Ghosh", "Banerjee", "Roy", "Chatterjee", "Bose", "Saha", "Dutta", "Pal", "Mondal", "Biswas", "Sarkar", "Majumdar", "Chakraborty", "Halder", "Nag", "Mitra", "Kundu"];

export function today(): string {
  const d = new Date();
  const ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}
export function monthOf(date: string) {
  return date.slice(0, 7);
}
export function addMonths(period: string, n: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function monthLabel(period: string, lang: "en" | "bn"): string {
  const [y, m] = period.split("-").map(Number);
  const en = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const bn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  return `${(lang === "bn" ? bn : en)[m - 1]} ${y}`;
}

export function sampleData(site: string, businessName: string, sector: Sector): BizData {
  const rnd = seeded(site);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => Math.round((a + rnd() * (b - a)) / 50) * 50;
  const now = today();
  const thisMonth = monthOf(now);
  const people: Person[] = [];
  const count = sector.monthly ? 26 : 18;
  for (let i = 0; i < count; i++) {
    const monthsAgo = Math.floor(rnd() * 18);
    const joinedMonth = addMonths(thisMonth, -monthsAgo);
    people.push({
      id: `p${i + 1}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `9${Math.floor(100000000 + rnd() * 899999999)}`,
      group: sector.groups.length ? pick(sector.groups) : "",
      fee: between(sector.feeRange[0], sector.feeRange[1]),
      joined: `${joinedMonth}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}`,
      active: rnd() > 0.12,
    });
  }

  const dues: Due[] = [];
  const payments: Payment[] = [];
  let n = 0;
  const day = Number(now.slice(8, 10));
  for (const p of people) {
    if (sector.monthly) {
      // A fee for each of the last six months since joining; most are paid,
      // some this month and last month are not.
      for (let k = 5; k >= 0; k--) {
        const period = addMonths(thisMonth, -k);
        if (period < monthOf(p.joined)) continue;
        const d: Due = { id: `d${++n}`, personId: p.id, title: "Monthly fee", period, amount: p.fee, paid: 0, dueDate: `${period}-10` };
        const paidChance = k === 0 ? 0.45 : k === 1 ? 0.8 : 0.95;
        if (p.active && rnd() < paidChance) {
          d.paid = d.amount;
          const payDay = k === 0 ? Math.max(1, Math.floor(rnd() * day)) : 1 + Math.floor(rnd() * 12);
          payments.push({ id: `pay${n}`, personId: p.id, dueId: d.id, amount: d.amount, method: pick(["upi", "upi", "cash", "bank"] as const), date: `${period}-${String(payDay).padStart(2, "0")}` });
        } else if (!p.active && k > 2) {
          d.paid = d.amount;
          payments.push({ id: `pay${n}`, personId: p.id, dueId: d.id, amount: d.amount, method: "cash", date: `${period}-05` });
        }
        dues.push(d);
      }
    } else {
      // Bills: two or three per person over six months, an advance on some.
      const bills = 1 + Math.floor(rnd() * 3);
      for (let b = 0; b < bills; b++) {
        const period = addMonths(thisMonth, -Math.floor(rnd() * 6));
        const amount = between(sector.feeRange[0], sector.feeRange[1]);
        const d: Due = { id: `d${++n}`, personId: p.id, title: sector.money.en === "Bookings" ? "Booking" : "Bill", period, amount, paid: 0, dueDate: `${period}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}` };
        const r = rnd();
        if (r < 0.7) d.paid = amount;
        else if (r < 0.85) d.paid = Math.round(amount / 2 / 50) * 50;
        if (d.paid > 0) payments.push({ id: `pay${n}`, personId: p.id, dueId: d.id, amount: d.paid, method: pick(["upi", "cash", "bank"] as const), date: d.dueDate <= now ? d.dueDate : now });
        dues.push(d);
      }
    }
  }

  const expenses: Expense[] = [];
  let e = 0;
  for (let k = 5; k >= 0; k--) {
    const period = addMonths(thisMonth, -k);
    sector.expenseCategories.forEach((cat, i) => {
      if (k === 0 && day < 15 && i > 2) return;
      const base = i === 0 ? 8000 : i === 1 ? 12000 : 1500;
      expenses.push({ id: `e${++e}`, title: cat.en, category: cat.en, amount: between(base * 0.7, base * 1.3), date: `${period}-${String(Math.min(day, 2 + i * 5)).padStart(2, "0")}` });
    });
  }

  const items: Item[] = [];
  if (sector.items) {
    const names = sector.key === "shop" ? ["Item A", "Item B", "Item C", "Item D", "Item E", "Item F", "Item G", "Item H"] : sector.key === "health" ? ["Paracetamol 500", "Cotton roll", "Gloves (box)", "Syringe 5 ml", "ORS sachet", "Antiseptic"] : sector.key === "fitness" ? ["Whey protein 1 kg", "Shaker bottle", "Gloves", "Resistance band", "Towel"] : ["Package: Basic", "Package: Standard", "Package: Premium", "Chairs (hire)", "Lights (hire)"];
    names.forEach((nm, i) => {
      const stock = Math.floor(rnd() * 60);
      items.push({ id: `i${i + 1}`, name: nm, unit: "pcs", price: between(50, 2500), stock, minStock: 10 });
    });
  }

  const staff: Staff[] = [
    { id: "s1", name: `${pick(FIRST)} ${pick(LAST)}`, phone: `9${Math.floor(100000000 + rnd() * 899999999)}`, role: sector.key === "classes" ? "Teacher" : "Staff", canSee: ["people", "payments"] },
    { id: "s2", name: `${pick(FIRST)} ${pick(LAST)}`, phone: `9${Math.floor(100000000 + rnd() * 899999999)}`, role: "Front desk", canSee: ["people", "payments", "items"] },
  ];

  return { version: DATA_VERSION, business: { name: businessName, upi: `${site.replace(/-/g, "")}@upi`, plan: "business" }, people, dues, payments, expenses, items, staff };
}

// ---------------------------------------------------------------- sums
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function sumPayments(payments: Payment[], from: string, to: string) {
  return payments.filter((p) => p.date >= from && p.date <= to).reduce((s, p) => s + p.amount, 0);
}
export function sumExpenses(expenses: Expense[], from: string, to: string) {
  return expenses.filter((p) => p.date >= from && p.date <= to).reduce((s, p) => s + p.amount, 0);
}
export function outstanding(dues: Due[], activeIds?: Set<string>) {
  return dues.filter((d) => !activeIds || activeIds.has(d.personId)).reduce((s, d) => s + Math.max(0, d.amount - d.paid), 0);
}
export function duesOf(dues: Due[], personId: string) {
  return dues.filter((d) => d.personId === personId && d.paid < d.amount);
}
