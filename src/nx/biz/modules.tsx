"use client";

import { useMemo, useState } from "react";
import { t } from "../i18n";
import { useSite } from "../panel/provider";
import { useAccess } from "../panel/access";
import { PageTitle, Stat } from "../panel/shell";
import { Button, Card, Icon, Label, Notice, inputCls } from "../panel/ui";
import { addMonths, duesOf, inr, monthLabel, monthOf, outstanding, sumExpenses, sumPayments, today, type Due, type Payment, type Person } from "./data";
import { b } from "./i18n";
import { newId, useBiz } from "./store";

/* The business screens. Each one is a plain list with one big action, the
   way a shopkeeper's notebook works. */

const waLink = (phone: string, text: string) => `https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(text)}`;

function personDue(dues: Due[], id: string) {
  return duesOf(dues, id).reduce((s, d) => s + d.amount - d.paid, 0);
}

// ------------------------------------------------------------------ Dashboard
export function Dashboard() {
  const { lang } = useSite();
  const { data, sector } = useBiz();
  const now = today();
  const month = monthOf(now);
  const monthStart = `${month}-01`;
  const activeIds = new Set(data.people.filter((p) => p.active).map((p) => p.id));
  const todayCol = sumPayments(data.payments, now, now);
  const monthCol = sumPayments(data.payments, monthStart, now);
  const monthExp = sumExpenses(data.expenses, monthStart, now);
  const pending = outstanding(data.dues, activeIds);
  const owing = data.people.filter((p) => p.active && personDue(data.dues, p.id) > 0);
  const inactive = data.people.filter((p) => !p.active);
  const low = data.items.filter((i) => i.stock <= i.minStock);
  const net = monthCol - monthExp;

  const tips: { icon: string; tone: "bad" | "warn" | "good"; title: string; text: string; href: string; cta: string }[] = [];
  if (net < 0) tips.push({ icon: "trending_down", tone: "bad", title: lang === "bn" ? `এই মাসে ${inr(-net)} ক্ষতি চলছে` : `Running at a loss of ${inr(-net)} this month`, text: lang === "bn" ? `আয় ${inr(monthCol)}, খরচ ${inr(monthExp)}। আগে বাকি টাকা তুলুন।` : `Income ${inr(monthCol)} against expenses ${inr(monthExp)}. Start by collecting what is pending.`, href: "payments", cta: lang === "bn" ? "বাকি দেখুন" : "See pending" });
  if (owing.length) tips.push({ icon: "chat", tone: "warn", title: lang === "bn" ? `${owing.length} জনের ${inr(pending)} বাকি` : `${owing.length} ${sector.people.en.toLowerCase()} owe ${inr(pending)}`, text: lang === "bn" ? "এক চাপে হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান।" : "Send WhatsApp reminders with one tap each.", href: "reminders", cta: lang === "bn" ? "রিমাইন্ডার পাঠান" : "Send reminders" });
  if (inactive.length) tips.push({ icon: "person_off", tone: "warn", title: lang === "bn" ? `${inactive.length} জন নিষ্ক্রিয়` : `${inactive.length} ${sector.people.en.toLowerCase()} are inactive`, text: lang === "bn" ? "একটা ফোন বা হোয়াটসঅ্যাপ করলে একজন ফিরলেই মাসের আয় বাড়ে।" : "A call or a WhatsApp message brings some back, and each one is monthly income.", href: "people", cta: lang === "bn" ? "তালিকা দেখুন" : "View list" });
  if (low.length) tips.push({ icon: "inventory_2", tone: "warn", title: lang === "bn" ? `${low.length}টি জিনিস কমে আসছে` : `${low.length} items are running low`, text: low.map((i) => i.name).slice(0, 3).join(", "), href: "items", cta: lang === "bn" ? "স্টক দেখুন" : "See stock" });
  if (!tips.length) tips.push({ icon: "check_circle", tone: "good", title: b(lang, "allGood"), text: "", href: "reports", cta: b(lang, "reports") });

  return (
    <>
      <PageTitle title={b(lang, "dashboard")} sub={lang === "bn" ? `${monthLabel(month, "bn")} · ${data.business.name}` : `${monthLabel(month, "en")} · ${data.business.name}`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat icon="currency_rupee" label={b(lang, "today")} value={inr(todayCol)} tone="good" />
        <Stat icon="trending_up" label={b(lang, "thisMonth")} value={inr(monthCol)} />
        <Stat icon="schedule" label={b(lang, "pending")} value={inr(pending)} tone="warn" />
        <Stat icon="warning" label={b(lang, "defaulters")} value={String(owing.length)} tone={owing.length ? "bad" : "plain"} />
        <Stat icon="groups" label={`${b(lang, "total")} ${sector.people[lang].toLowerCase()}`} value={String(data.people.length)} />
        <Stat icon={net >= 0 ? "savings" : "trending_down"} label={net >= 0 ? b(lang, "profit") : b(lang, "loss")} value={inr(Math.abs(net))} tone={net >= 0 ? "good" : "bad"} />
      </div>
      <Card className="mt-5">
        <h2 className="indic flex items-center gap-2 text-lg font-bold text-slate-900">
          <Icon name="lightbulb" className="text-[22px] text-amber-500" />
          {b(lang, "whatNext")}
        </h2>
        <div className="mt-3 grid gap-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3 sm:flex-nowrap">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tip.tone === "bad" ? "bg-rose-50 text-rose-600" : tip.tone === "warn" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                <Icon name={tip.icon} className="text-[24px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="indic text-base font-bold text-slate-900">{tip.title}</div>
                {tip.text ? <div className="indic text-sm text-slate-600">{tip.text}</div> : null}
              </div>
              <a href={`./${tip.href}`} className="indic inline-flex min-h-[44px] items-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-200">
                {tip.cta}
              </a>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// --------------------------------------------------------------------- People
export function People() {
  const { lang } = useSite();
  const { data, sector, update } = useBiz();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", fee: String(sector.feeRange[0]), group: sector.groups[0] ?? "" });
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.people.filter((p) => !s || p.name.toLowerCase().includes(s) || p.phone.includes(s)).sort((a, c) => Number(c.active) - Number(a.active) || personDue(data.dues, c.id) - personDue(data.dues, a.id));
  }, [data, q]);
  const open = data.people.find((p) => p.id === openId);

  const addPerson = () => {
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length !== 10) return;
    const p: Person = { id: newId("p"), name: form.name.trim(), phone: form.phone.replace(/\D/g, "").slice(-10), fee: Number(form.fee) || 0, group: form.group, joined: today(), active: true };
    update((d) => {
      const dues = sector.monthly && p.fee > 0 ? [...d.dues, { id: newId("d"), personId: p.id, title: "Monthly fee", period: monthOf(today()), amount: p.fee, paid: 0, dueDate: `${monthOf(today())}-10` }] : d.dues;
      return { ...d, people: [p, ...d.people], dues };
    });
    setAdding(false);
    setForm({ name: "", phone: "", fee: String(sector.feeRange[0]), group: sector.groups[0] ?? "" });
  };

  return (
    <>
      <PageTitle
        title={sector.people[lang]}
        sub={`${data.people.filter((p) => p.active).length} ${b(lang, "active").toLowerCase()} · ${data.people.length} ${b(lang, "total").toLowerCase()}`}
        right={
          <Button icon="person_add" onClick={() => setAdding((v) => !v)}>
            {b(lang, "add")} {sector.person[lang]}
          </Button>
        }
      />
      {adding ? (
        <Card className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{b(lang, "name")}</Label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "phone")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>{sector.monthly ? b(lang, "fee") : b(lang, "usualBill")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
          </div>
          {sector.group ? (
            <div>
              <Label>{sector.group[lang]}</Label>
              <select className={inputCls} value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                {sector.groups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={addPerson}>{b(lang, "save")}</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {b(lang, "cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="relative mb-4">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[22px] text-slate-400" />
        <input className={`${inputCls} pl-12`} placeholder={b(lang, "search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {list.map((p) => {
          const due = personDue(data.dues, p.id);
          return (
            <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-[#2b5cff]">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold ${p.active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"}`}>{p.name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-slate-900">{p.name}</div>
                <div className="truncate text-sm text-slate-500">
                  +91 {p.phone.slice(0, 5)} {p.phone.slice(5)}
                  {p.group ? ` · ${p.group}` : ""}
                  {!p.active ? ` · ${b(lang, "inactive")}` : ""}
                </div>
              </div>
              <div className={`indic w-20 shrink-0 text-right text-sm font-semibold leading-tight sm:w-auto ${due > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {due > 0 ? (
                  <>
                    <span className="block text-xs font-medium sm:inline sm:text-sm">{b(lang, "owes")} </span>
                    {inr(due)}
                  </>
                ) : (
                  b(lang, "paidUp")
                )}
              </div>
            </button>
          );
        })}
        {!list.length ? <p className="indic text-slate-500">{b(lang, "noResults")}</p> : null}
      </div>
      {open ? <PersonSheet person={open} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

function PersonSheet({ person, onClose }: { person: Person; onClose: () => void }) {
  const { lang } = useSite();
  const { data, update, sector } = useBiz();
  const dues = duesOf(data.dues, person.id);
  const paid = data.payments.filter((p) => p.personId === person.id).sort((a, c) => (a.date < c.date ? 1 : -1)).slice(0, 6);
  const msg = b(lang, "reminderTemplate").replace("{name}", person.name).replace("{business}", data.business.name).replace("{title}", dues[0]?.title ?? sector.money.en).replace("{amount}", String(dues.reduce((s, d) => s + d.amount - d.paid, 0))).replace("{period}", dues[0] ? monthLabel(dues[0].period, lang) : "").replace("{upi}", data.business.upi);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{person.name}</h2>
            <p className="text-sm text-slate-500">
              +91 {person.phone.slice(0, 5)} {person.phone.slice(5)} · {b(lang, "joined")} {person.joined}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={b(lang, "close")} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={`tel:+91${person.phone}`} variant="ghost" icon="call" className="min-h-[44px]">
            {lang === "bn" ? "কল" : "Call"}
          </Button>
          {dues.length ? (
            <Button href={waLink(person.phone, msg)} target="_blank" variant="secondary" icon="chat" className="min-h-[44px]">
              {b(lang, "sendWa")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            icon={person.active ? "person_off" : "person_check"}
            className="min-h-[44px]"
            onClick={() => update((d) => ({ ...d, people: d.people.map((p) => (p.id === person.id ? { ...p, active: !p.active } : p)) }))}
          >
            {person.active ? b(lang, "inactive") : b(lang, "active")}
          </Button>
        </div>
        <h3 className="indic mt-5 text-base font-bold text-slate-900">{b(lang, "pendingTab")}</h3>
        {dues.length ? (
          <div className="mt-2 grid gap-2">
            {dues.map((d) => (
              <DueRow key={d.id} due={d} />
            ))}
          </div>
        ) : (
          <p className="indic mt-1 text-sm text-emerald-700">{b(lang, "paidUp")}</p>
        )}
        <h3 className="indic mt-5 text-base font-bold text-slate-900">{b(lang, "collectedTab")}</h3>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {paid.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span className="text-slate-600">
                {p.date} · {b(lang, p.method)}
              </span>
              <span className="font-semibold text-slate-900">{inr(p.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DueRow({ due }: { due: Due }) {
  const { lang } = useSite();
  const { update } = useBiz();
  const [method, setMethod] = useState<Payment["method"]>("upi");
  const left = due.amount - due.paid;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
      <div className="min-w-0 flex-1">
        <div className="indic text-sm font-semibold text-slate-900">
          {due.title} · {monthLabel(due.period, lang)}
        </div>
        <div className="text-sm text-rose-700">{inr(left)}</div>
      </div>
      <select className="min-h-[44px] rounded-xl border border-slate-300 px-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value as Payment["method"])}>
        <option value="upi">{b(lang, "upi")}</option>
        <option value="cash">{b(lang, "cash")}</option>
        <option value="bank">{b(lang, "bank")}</option>
      </select>
      <button
        type="button"
        className="indic inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white"
        onClick={() =>
          update((d) => ({
            ...d,
            dues: d.dues.map((x) => (x.id === due.id ? { ...x, paid: x.amount } : x)),
            payments: [...d.payments, { id: newId("pay"), personId: due.personId, dueId: due.id, amount: left, method, date: today() }],
          }))
        }
      >
        <Icon name="check" className="text-[18px]" />
        {b(lang, "markPaid")}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------- Payments
export function Payments() {
  const { lang } = useSite();
  const { data, sector, update } = useBiz();
  const [tab, setTab] = useState<"pending" | "collected">("pending");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ personId: data.people[0]?.id ?? "", title: sector.money.en === "Bookings" ? "Booking" : "Bill", amount: "", paidNow: true });
  const byPerson = new Map(data.people.map((p) => [p.id, p]));
  const pending = data.dues.filter((d) => d.paid < d.amount && byPerson.get(d.personId)?.active).sort((a, c) => (a.dueDate < c.dueDate ? -1 : 1));
  const collected = data.payments.slice().sort((a, c) => (a.date < c.date ? 1 : -1)).slice(0, 60);
  const month = monthOf(today());
  return (
    <>
      <PageTitle
        title={b(lang, "payments")}
        sub={`${b(lang, "thisMonth")}: ${inr(sumPayments(data.payments, `${month}-01`, today()))} · ${b(lang, "pending")}: ${inr(outstanding(data.dues, new Set(data.people.filter((p) => p.active).map((p) => p.id))))}`}
        right={
          <Button icon="add" onClick={() => setAdding((v) => !v)}>
            {b(lang, "newBill")}
          </Button>
        }
      />
      {adding ? (
        <Card className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{sector.person[lang]}</Label>
            <select className={inputCls} value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })}>
              {data.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{b(lang, "title")}</Label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "amount")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 self-end text-base">
            <input type="checkbox" className="h-5 w-5" checked={form.paidNow} onChange={(e) => setForm({ ...form, paidNow: e.target.checked })} />
            <span className="indic">{b(lang, "paidOn")}</span>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              onClick={() => {
                const amount = Number(form.amount);
                if (!amount || !form.personId) return;
                const due: Due = { id: newId("d"), personId: form.personId, title: form.title || "Bill", period: month, amount, paid: form.paidNow ? amount : 0, dueDate: today() };
                update((d) => ({ ...d, dues: [due, ...d.dues], payments: form.paidNow ? [...d.payments, { id: newId("pay"), personId: due.personId, dueId: due.id, amount, method: "upi", date: today() }] : d.payments }));
                setAdding(false);
                setForm({ ...form, amount: "" });
              }}
            >
              {b(lang, "save")}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {b(lang, "cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1">
        {(["pending", "collected"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`indic min-h-[44px] rounded-full px-5 text-base font-semibold ${tab === k ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}>
            {b(lang, k === "pending" ? "pendingTab" : "collectedTab")}
          </button>
        ))}
      </div>
      {tab === "pending" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {pending.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 text-base font-semibold text-slate-900">{byPerson.get(d.personId)?.name}</div>
              <DueRow due={d} />
            </div>
          ))}
          {!pending.length ? <Notice tone="good">{b(lang, "allGood")}</Notice> : null}
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {collected.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-base">
                <span className="min-w-0 truncate text-slate-800">{byPerson.get(p.personId)?.name ?? "?"}</span>
                <span className="shrink-0 text-sm text-slate-500">
                  {p.date} · {b(lang, p.method)}
                </span>
                <span className="shrink-0 font-semibold text-emerald-700">{inr(p.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

// ------------------------------------------------------------------- Expenses
export function Expenses() {
  const { lang } = useSite();
  const { data, sector, update } = useBiz();
  const [month, setMonth] = useState(monthOf(today()));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", category: sector.expenseCategories[0].en, amount: "", date: today() });
  const rows = data.expenses.filter((e) => e.date.startsWith(month)).sort((a, c) => (a.date < c.date ? 1 : -1));
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const cat = (en: string) => sector.expenseCategories.find((c) => c.en === en)?.[lang] ?? en;
  return (
    <>
      <PageTitle
        title={b(lang, "expenses")}
        sub={`${monthLabel(month, lang)}: ${inr(total)}`}
        right={
          <Button icon="add" onClick={() => setAdding((v) => !v)}>
            {b(lang, "newExpense")}
          </Button>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <button type="button" aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100" onClick={() => setMonth(addMonths(month, -1))}>
          <Icon name="chevron_left" className="text-[24px]" />
        </button>
        <span className="indic min-w-[10rem] text-center text-base font-semibold">{monthLabel(month, lang)}</span>
        <button type="button" aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100" onClick={() => setMonth(addMonths(month, 1))}>
          <Icon name="chevron_right" className="text-[24px]" />
        </button>
      </div>
      {adding ? (
        <Card className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{b(lang, "title")}</Label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "category")}</Label>
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {sector.expenseCategories.map((c) => (
                <option key={c.en} value={c.en}>
                  {c[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{b(lang, "amount")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "date")}</Label>
            <input className={inputCls} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              onClick={() => {
                const amount = Number(form.amount);
                if (!amount) return;
                update((d) => ({ ...d, expenses: [{ id: newId("e"), title: form.title || form.category, category: form.category, amount, date: form.date }, ...d.expenses] }));
                setAdding(false);
                setForm({ ...form, title: "", amount: "" });
              }}
            >
              {b(lang, "save")}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {b(lang, "cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
      <Card>
        <ul className="divide-y divide-slate-100">
          {rows.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-base">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{e.title === e.category ? cat(e.category) : e.title}</div>
                <div className="indic text-sm text-slate-500">
                  {cat(e.category)} · {e.date}
                </div>
              </div>
              <span className="shrink-0 font-semibold text-rose-700">{inr(e.amount)}</span>
            </li>
          ))}
          {!rows.length ? <li className="indic py-3 text-slate-500">{b(lang, "noResults")}</li> : null}
        </ul>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------- Items
export function Items() {
  const { lang } = useSite();
  const { data, sector, update } = useBiz();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  const low = data.items.filter((i) => i.stock <= i.minStock).length;
  return (
    <>
      <PageTitle
        title={sector.items?.[lang] ?? b(lang, "item")}
        sub={low ? `${low} ${b(lang, "lowStock").toLowerCase()}` : undefined}
        right={
          <Button icon="add" onClick={() => setAdding((v) => !v)}>
            {b(lang, "newItem")}
          </Button>
        }
      />
      {adding ? (
        <Card className="mb-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label>{b(lang, "item")}</Label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "price")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "stock")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                update((d) => ({ ...d, items: [{ id: newId("i"), name: form.name.trim(), unit: "pcs", price: Number(form.price) || 0, stock: Number(form.stock) || 0, minStock: 10 }, ...d.items] }));
                setAdding(false);
                setForm({ name: "", price: "", stock: "" });
              }}
            >
              {b(lang, "save")}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {b(lang, "cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-2 lg:grid-cols-2">
        {data.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-slate-900">{i.name}</div>
              <div className="text-sm text-slate-500">
                {inr(i.price)} · {b(lang, "stock")}: <b className={i.stock <= i.minStock ? "text-rose-700" : "text-slate-800"}>{i.stock}</b>
                {i.stock <= i.minStock ? <span className="indic ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">{b(lang, "lowStock")}</span> : null}
              </div>
            </div>
            <button type="button" aria-label="-1" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl font-bold" onClick={() => update((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)) }))}>
              −
            </button>
            <button type="button" aria-label="+1" className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xl font-bold text-brand-700" onClick={() => update((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, stock: x.stock + 1 } : x)) }))}>
              +
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// -------------------------------------------------------------------- Reports
export function Reports() {
  const { lang } = useSite();
  const { data, sector } = useBiz();
  const [scope, setScope] = useState<"month" | "half" | "year">("month");
  const now = today();
  const month = monthOf(now);
  const from = scope === "month" ? `${month}-01` : scope === "half" ? `${addMonths(month, -5)}-01` : `${month.slice(0, 4)}-01-01`;
  const income = sumPayments(data.payments, from, now);
  const spent = sumExpenses(data.expenses, from, now);
  const net = income - spent;
  const byCat = new Map<string, number>();
  for (const e of data.expenses) if (e.date >= from && e.date <= now) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const cats = Array.from(byCat.entries()).sort((a, c) => c[1] - a[1]);
  const active = data.people.filter((p) => p.active);
  const avgFee = active.length ? Math.round(active.reduce((s, p) => s + p.fee, 0) / active.length) : 0;
  const owing = active.filter((p) => personDue(data.dues, p.id) > 0).length;
  const pending = outstanding(data.dues, new Set(active.map((p) => p.id)));
  const cat = (en: string) => sector.expenseCategories.find((c) => c.en === en)?.[lang] ?? en;
  const tips: string[] = [];
  if (cats[0]) tips.push(lang === "bn" ? `সবচেয়ে বড় খরচ ${cat(cats[0][0])}, ${inr(cats[0][1])}। আগে এটা কমানোর চেষ্টা করুন।` : `Largest expense is ${cat(cats[0][0])} at ${inr(cats[0][1])}. Look at this line first.`);
  if (avgFee && sector.monthly) tips.push(lang === "bn" ? `গড় ফি ${inr(avgFee)}। প্রায় ${Math.ceil(spent / Math.max(1, scope === "month" ? 1 : scope === "half" ? 6 : 12) / avgFee)} জন সক্রিয় থাকলে মাসের খরচ উঠে আসে। প্রতিটি নতুন ভর্তি মানে মাসে ${inr(avgFee)} বাড়তি আয়।` : `At an average fee of ${inr(avgFee)}, about ${Math.ceil(spent / Math.max(1, scope === "month" ? 1 : scope === "half" ? 6 : 12) / avgFee)} active ${sector.people.en.toLowerCase()} cover a month's expenses. Each new admission adds ${inr(avgFee)} a month.`);
  if (pending > 0) tips.push(lang === "bn" ? `${inr(pending)} বকেয়া আছে। মাসের ১ থেকে ১০ তারিখে রিমাইন্ডার পাঠালে আদায় অনেক বাড়ে।` : `${inr(pending)} is outstanding. Reminders between the 1st and the 10th make the biggest difference.`);
  return (
    <>
      <PageTitle
        title={b(lang, "reports")}
        right={
          <Button variant="secondary" icon="print" className="nx-no-print" onClick={() => window.print()}>
            {b(lang, "savePdf")}
          </Button>
        }
      />
      <div className="nx-no-print mb-4 inline-flex rounded-full bg-slate-100 p-1">
        {(["month", "half", "year"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setScope(k)} className={`indic min-h-[44px] rounded-full px-5 text-base font-semibold ${scope === k ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}>
            {b(lang, k)}
          </button>
        ))}
      </div>
      <div className="print-area">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="text-xl font-bold text-slate-900">{data.business.name}</div>
            <div className="indic text-sm text-slate-500">
              {from} to {now}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon="trending_up" label={b(lang, "collected")} value={inr(income)} tone="good" />
          <Stat icon="trending_down" label={b(lang, "spent")} value={inr(spent)} tone="bad" />
          <Stat icon={net >= 0 ? "savings" : "warning"} label={b(lang, "net")} value={`${net < 0 ? "-" : ""}${inr(Math.abs(net))}`} tone={net >= 0 ? "good" : "bad"} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="indic text-lg font-bold text-slate-900">{b(lang, "breakdown")}</h2>
            <div className="mt-3 grid gap-3">
              {cats.map(([c, v]) => (
                <div key={c}>
                  <div className="flex justify-between text-sm">
                    <span className="indic font-medium text-slate-800">{cat(c)}</span>
                    <span className="text-slate-600">
                      {inr(v)} · {spent ? Math.round((v / spent) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-[#2b5cff] to-[#4b2cf5]" style={{ width: `${spent ? (v / spent) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="indic text-lg font-bold text-slate-900">{b(lang, "health")}</h2>
            <dl className="mt-3 divide-y divide-slate-100 text-base">
              {[
                [`${b(lang, "active")} ${sector.people[lang].toLowerCase()}`, String(active.length)],
                [b(lang, "avgFee"), inr(avgFee)],
                [b(lang, "outstanding"), inr(pending)],
                [b(lang, "withDues"), String(owing)],
                [lang === "bn" ? "খরচ বনাম আয়" : "Expense to income", income ? `${Math.round((spent / income) * 100)}%` : "-"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <dt className="indic text-slate-600">{k}</dt>
                  <dd className="font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
        <Card className="mt-4">
          <h2 className="indic flex items-center gap-2 text-lg font-bold text-slate-900">
            <Icon name="lightbulb" className="text-[22px] text-amber-500" />
            {b(lang, "improve")}
          </h2>
          <ul className="indic mt-2 list-disc space-y-1.5 pl-5 text-base text-slate-700">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Reminders
export function Reminders() {
  const { lang } = useSite();
  const { data, sector } = useBiz();
  const [tpl, setTpl] = useState(b(lang, "reminderTemplate"));
  const rows = data.people.filter((p) => p.active && personDue(data.dues, p.id) > 0).map((p) => ({ p, dues: duesOf(data.dues, p.id) }));
  const render = (p: Person, dues: Due[]) => tpl.replace("{name}", p.name).replace("{business}", data.business.name).replace("{title}", dues[0]?.title ?? sector.money.en).replace("{amount}", String(dues.reduce((s, d) => s + d.amount - d.paid, 0))).replace("{period}", dues[0] ? monthLabel(dues[0].period, lang) : "").replace("{upi}", data.business.upi);
  return (
    <>
      <PageTitle title={b(lang, "reminders")} sub={`${rows.length} ${b(lang, "people")} · ${inr(rows.reduce((s, r) => s + r.dues.reduce((x, d) => x + d.amount - d.paid, 0), 0))}`} />
      <Card className="mb-4">
        <Label hint={b(lang, "remindAll")}>{b(lang, "message")}</Label>
        <textarea className={`${inputCls} min-h-[96px]`} value={tpl} onChange={(e) => setTpl(e.target.value)} />
      </Card>
      <div className="grid gap-2 lg:grid-cols-2">
        {rows.map(({ p, dues }) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-slate-900">{p.name}</div>
              <div className="text-sm text-rose-700">{inr(dues.reduce((s, d) => s + d.amount - d.paid, 0))}</div>
            </div>
            <a href={waLink(p.phone, render(p, dues))} target="_blank" rel="noopener" className="indic inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white">
              <Icon name="chat" className="text-[20px]" />
              {b(lang, "sendWa")}
            </a>
          </div>
        ))}
        {!rows.length ? <Notice tone="good">{b(lang, "allGood")}</Notice> : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------- Staff
export function Staff() {
  const { lang } = useSite();
  const { data, update } = useBiz();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "Staff" });
  return (
    <>
      <PageTitle
        title={b(lang, "staff")}
        right={
          <Button icon="person_add" onClick={() => setAdding((v) => !v)}>
            {b(lang, "addStaff")}
          </Button>
        }
      />
      {adding ? (
        <Card className="mb-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label>{b(lang, "name")}</Label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "phone")}</Label>
            <input className={inputCls} inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>{b(lang, "role")}</Label>
            <input className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                update((d) => ({ ...d, staff: [...d.staff, { id: newId("s"), name: form.name.trim(), phone: form.phone.replace(/\D/g, "").slice(-10), role: form.role, canSee: ["people", "payments"] }] }));
                setAdding(false);
                setForm({ name: "", phone: "", role: "Staff" });
              }}
            >
              {b(lang, "save")}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {b(lang, "cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-2 lg:grid-cols-2">
        {data.staff.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-50 text-lg font-bold text-violet-600">{s.name[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-slate-900">{s.name}</div>
              <div className="indic text-sm text-slate-500">
                {s.role} · +91 {s.phone.slice(0, 5)} {s.phone.slice(5)} · {b(lang, "canSee")}: {s.canSee.join(", ")}
              </div>
            </div>
            <button type="button" aria-label={t(lang, "remove")} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-rose-700" onClick={() => update((d) => ({ ...d, staff: d.staff.filter((x) => x.id !== s.id) }))}>
              <Icon name="delete" className="text-[22px]" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ------------------------------------------------------------------- Settings
export function Settings() {
  const { lang, setLang, site, storage, schema } = useSite();
  const { data, update, resetSample } = useBiz();
  const { access } = useAccess(site);
  return (
    <>
      <PageTitle title={b(lang, "settings")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-4">
          <div>
            <Label>{b(lang, "businessName")}</Label>
            <input className={inputCls} value={data.business.name} onChange={(e) => update((d) => ({ ...d, business: { ...d.business, name: e.target.value } }))} />
          </div>
          <div>
            <Label>{b(lang, "upiId")}</Label>
            <input className={inputCls} value={data.business.upi} onChange={(e) => update((d) => ({ ...d, business: { ...d.business, upi: e.target.value } }))} />
          </div>
          <div>
            <Label>{lang === "bn" ? "ভাষা" : "Language"}</Label>
            <div className="flex gap-2">
              {(["en", "bn"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={`indic min-h-[48px] flex-1 rounded-xl border-2 text-base font-semibold ${lang === l ? "border-[#2b5cff] bg-brand-50 text-brand-800" : "border-slate-200"}`}>
                  {l === "en" ? "English" : "বাংলা"}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Card className="grid gap-4">
          <div>
            <Label hint={b(lang, "accessNote")}>{b(lang, "plan")}</Label>
            <div className="grid gap-2">
              {(
                [
                  ["accessEdit", access.edit],
                  ["accessDashboard", access.dashboard],
                ] as const
              ).map(([key, on]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 p-3">
                  <div className="indic text-base font-semibold text-slate-900">{b(lang, key)}</div>
                  <span className={`indic rounded-full px-3 py-1 text-sm font-bold ${on ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{b(lang, on ? "on" : "off")}</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="secondary"
            icon="download"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ site, website: schema.name, ...data }, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${site}-records.json`;
              a.click();
            }}
          >
            {b(lang, "download")}
          </Button>
          {storage !== "neon" ? (
            <>
              <Notice tone="info">{b(lang, "demoNote")}</Notice>
              <Button variant="ghost" icon="restart_alt" onClick={resetSample}>
                {b(lang, "resetData")}
              </Button>
            </>
          ) : null}
        </Card>
      </div>
    </>
  );
}
