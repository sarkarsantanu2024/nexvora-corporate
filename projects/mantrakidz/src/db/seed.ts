/**
 * First-run data.
 *
 *  seedBase  – what the real business needs on day one: the admin login,
 *              the four programmes, the academic year, the head centre.
 *  seedDemo  – two SAMPLE franchise centres with children, fees, attendance,
 *              expenses, royalty and leads, so every screen can be seen
 *              working. Every sample centre has isDemo = true and is hidden
 *              from the public website; HQ › Settings removes them in one go.
 *
 * Dates are worked out from today, so the sample data always looks current.
 */
import bcrypt from 'bcryptjs';
import { count } from 'drizzle-orm';
import { addDays, addMonths, currentPeriod, financialYear, periodLabel, periodRange, todayIST, weekday } from '@/lib/date';
import { invoiceStatus, royaltyAmount } from '@/lib/money';
import type { DB } from './index';
import { PROGRAMME_I18N } from './programme-i18n';
import * as s from './schema';
import { seedSite } from './seed-site';

export const DEMO_PASSWORD = 'mantra123';

/** Small deterministic generator: the same sample data on every machine. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function insertChunks<T extends Record<string, unknown>>(db: DB, table: Parameters<DB['insert']>[0], rows: T[], size = 400) {
  for (let i = 0; i < rows.length; i += size) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(table).values(rows.slice(i, i + size) as any);
  }
}

export async function seedIfEmpty(db: DB) {
  const [{ n }] = await db.select({ n: count() }).from(s.users);
  if (n > 0) return;
  await seedBase(db);
  await seedDemo(db);
}

export async function seedBase(db: DB) {
  const today = todayIST();
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || DEMO_PASSWORD, 10);

  await db.insert(s.users).values({
    name: 'Head Office Admin',
    username: 'admin',
    passwordHash: hash,
    role: 'hq_admin',
    // A real deployment sets ADMIN_PASSWORD and is still asked to change it.
    mustChangePassword: Boolean(process.env.DATABASE_URL),
  });

  await db.insert(s.settings).values([
    {
      key: 'org',
      value: {
        name: 'Mantra Kidz',
        legalName: 'Mantra Kidz, a unit of Mind Mantra Abacus',
        phone: '8777896483',
        email: '',
        address: '17/106, Dakshindari Road, Kolkata 700048',
      },
    },
    { key: 'royalty', value: { dueDay: 10 } },
    {
      key: 'fees',
      value: {
        dueDay: 10,
        reminderTemplate:
          'Dear {parent}, the fee of {amount} for {child} ({month}) at {centre} is due. Kindly pay at the earliest. Thank you.',
        receiptFooter: 'Thank you. Fees once paid are not refundable.',
      },
    },
  ]);

  // April to March. Change it in HQ › Settings if the school runs January to December.
  const [y, m] = today.split('-').map(Number);
  const startYear = m >= 4 ? y : y - 1;
  await db.insert(s.academicYears).values({
    name: `${startYear}-${String(startYear + 1).slice(2)}`,
    startDate: `${startYear}-04-01`,
    endDate: `${startYear + 1}-03-31`,
    isCurrent: true,
  });

  const programmeRows: (typeof s.programmes.$inferInsert)[] = [
    {
      slug: 'play-group',
      name: 'Play Group',
      ageLabel: '1.5 to 2.5 years',
      ageFromMonths: 18,
      ageToMonths: 30,
      tagline: 'First steps away from home',
      description:
        'A gentle start to school life. Children settle in through free play, music, stories and simple routines, with a teacher close by at every moment.',
      highlights: ['Settling-in with a parent nearby', 'Sensory and messy play', 'Rhymes, music and movement', 'Toilet and self-feeding habits'],
      color: 'sun',
      timing: '',
      sort: 1,
    },
    {
      slug: 'nursery',
      name: 'Nursery',
      ageLabel: '2.5 to 3.5 years',
      ageFromMonths: 30,
      ageToMonths: 42,
      tagline: 'Curious hands, busy minds',
      description:
        'Children begin to work in a small group, speak in full sentences and hold a crayon with purpose. Learning stays hands-on: sorting, matching, building and pretending.',
      highlights: ['Spoken English and Bengali', 'Pre-writing strokes', 'Colours, shapes and counting to 20', 'Art, craft and clay'],
      color: 'coral',
      timing: '',
      sort: 2,
    },
    {
      slug: 'lkg',
      name: 'LKG',
      ageLabel: '3.5 to 4.5 years',
      ageFromMonths: 42,
      ageToMonths: 54,
      tagline: 'Letters, numbers and confidence',
      description:
        'Reading and number work begin in earnest, through phonics, number games and plenty of practice. Children learn to speak up, take turns and finish what they start.',
      highlights: ['Phonics and first words', 'Numbers to 50 and simple addition', 'Writing letters and numerals', 'Show-and-tell and stage time'],
      color: 'mint',
      timing: '',
      sort: 3,
    },
    {
      slug: 'ukg',
      name: 'UKG',
      ageLabel: '4.5 to 5.5 years',
      ageFromMonths: 54,
      ageToMonths: 66,
      tagline: 'Ready for big school',
      description:
        'The year that prepares a child for Class 1: reading short sentences, writing neatly, working with numbers and sitting for a full lesson, without losing the joy of play.',
      highlights: ['Reading sentences and short stories', 'Addition, subtraction and number names', 'Neat writing in English and Bengali', 'Preparation for school interviews'],
      color: 'sky',
      timing: '',
      sort: 4,
    },
  ];
  await db.insert(s.programmes).values(programmeRows.map((row) => ({ ...row, i18n: PROGRAMME_I18N[row.slug] ?? {} })));

  await db.insert(s.counters).values({ key: 'centre:code', value: 1 });
  await db.insert(s.centres).values({
    code: 'MK-001',
    name: 'Mantra Kidz Dakshindari',
    slug: 'dakshindari',
    status: 'active',
    isCompanyOwned: true,
    address: '17/106, Dakshindari Road',
    area: 'Dakshindari',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700048',
    phone: '8777896483',
    whatsapp: '8777896483',
    royaltyType: 'fixed',
    royaltyValue: 0,
    notes: 'Head school. Details copied from the old website; please confirm them.',
  });

  await seedSite(db);
}

/* ───────────────────────────── sample data ───────────────────────────── */

const BOYS = ['Aarav', 'Ayaan', 'Rishi', 'Arjun', 'Soham', 'Debojit', 'Ishaan', 'Rudra', 'Aryan', 'Sayan', 'Ritam', 'Anik', 'Shreyan', 'Aditya', 'Neel', 'Arnab', 'Vihaan', 'Kabir'];
const GIRLS = ['Aadhya', 'Ananya', 'Ishita', 'Riya', 'Sneha', 'Mishti', 'Anwesha', 'Diya', 'Tiasha', 'Aarohi', 'Sanvi', 'Pihu', 'Oishi', 'Srija', 'Trisha', 'Adrija', 'Myra', 'Kiara'];
const SURNAMES = ['Das', 'Ghosh', 'Saha', 'Roy', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Sarkar', 'Mondal', 'Dutta', 'Paul', 'Biswas', 'Sen', 'Bose', 'Majumdar', 'Chakraborty', 'Halder', 'Nandi', 'Agarwal', 'Singh'];
const FATHERS = ['Subhajit', 'Arindam', 'Sourav', 'Prosenjit', 'Rajib', 'Abhijit', 'Santanu', 'Kaushik', 'Debasish', 'Amit', 'Sumit', 'Partha', 'Indranil', 'Tapas', 'Biswajit', 'Pritam'];
const MOTHERS = ['Moumita', 'Priyanka', 'Sudipa', 'Rimpa', 'Tanusree', 'Payel', 'Soma', 'Ankita', 'Debjani', 'Suparna', 'Mousumi', 'Papiya', 'Riya', 'Sharmistha', 'Poulami', 'Jhuma'];
const STREETS = ['Jessore Road', 'S K Deb Road', 'Kalindi', 'Bangur Avenue', 'Lake Town Block A', 'Sribhumi', 'Patipukur', 'CA Block', 'BD Block', 'Karunamoyee', 'AE Block', 'Dum Dum Park'];

const FEES: Record<string, number> = { 'play-group': 2200, nursery: 2500, lkg: 2800, ukg: 3000 };

export async function seedDemo(db: DB) {
  const rand = rng(20261115);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const today = todayIST();
  const period = currentPeriod();
  const fy = financialYear(today);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const programmes = await db.select().from(s.programmes).orderBy(s.programmes.sort);
  const [year] = await db.select().from(s.academicYears);
  const [admin] = await db.select().from(s.users);
  const [head] = await db.select().from(s.centres);

  await db.insert(s.users).values([
    { name: 'Head Office Staff', username: 'hqstaff', passwordHash: hash, role: 'hq_staff' },
    { name: 'Dakshindari School Head', username: 'dakshindari', passwordHash: hash, role: 'centre_admin', centreId: head.id },
  ]);

  const centreSpecs = [
    {
      code: 'MK-002', name: 'Mantra Kidz Lake Town (sample)', slug: 'lake-town-sample', area: 'Lake Town', pincode: '700089',
      address: '12, Lake Town Block B', owner: 'Sudeshna Roy', phone: '9000000002', username: 'laketown',
      monthsOpen: 14, students: 34, royaltyType: 'percent' as const, royaltyValue: 12, franchiseFee: 250000, rent: 28000,
    },
    {
      code: 'MK-003', name: 'Mantra Kidz Salt Lake (sample)', slug: 'salt-lake-sample', area: 'Salt Lake', pincode: '700064',
      address: 'CA 41, Sector 1', owner: 'Rahul Agarwal', phone: '9000000003', username: 'saltlake',
      monthsOpen: 6, students: 21, royaltyType: 'fixed' as const, royaltyValue: 8000, franchiseFee: 250000, rent: 35000,
    },
  ];

  let phoneSeq = 9000001000;
  let firstParent: { username: string; id: string } | null = null;

  for (const spec of centreSpecs) {
    const openedOn = `${addMonths(period, -spec.monthsOpen)}-05`;
    const [centre] = await db
      .insert(s.centres)
      .values({
        code: spec.code,
        name: spec.name,
        slug: spec.slug,
        status: 'active',
        isDemo: true,
        showOnWebsite: false,
        address: spec.address,
        area: spec.area,
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: spec.pincode,
        phone: spec.phone,
        whatsapp: spec.phone,
        ownerName: spec.owner,
        ownerPhone: spec.phone,
        openedOn,
        agreementStart: openedOn,
        agreementEnd: addDays(openedOn, 365 * 5),
        franchiseFee: spec.franchiseFee,
        franchiseFeePaid: spec.franchiseFee,
        royaltyType: spec.royaltyType,
        royaltyValue: spec.royaltyValue,
        notes: 'Sample school for demonstration. Remove it from HQ › Settings.',
      })
      .returning();

    await db.insert(s.users).values([
      { name: spec.owner, username: spec.username, phone: spec.phone, passwordHash: hash, role: 'centre_admin', centreId: centre.id },
      { name: `${spec.area} Front Desk`, username: `${spec.username}.desk`, passwordHash: hash, role: 'centre_staff', centreId: centre.id },
    ]);
    const [centreAdmin] = await db.select().from(s.users).where(eqUsername(spec.username));

    /* staff */
    const staffRows = await db
      .insert(s.staff)
      .values(
        [
          { name: `${pick(MOTHERS)} ${pick(SURNAMES)}`, roleTitle: 'School Head', monthlySalary: 18000 },
          { name: `${pick(MOTHERS)} ${pick(SURNAMES)}`, roleTitle: 'Teacher', monthlySalary: 12000 },
          { name: `${pick(MOTHERS)} ${pick(SURNAMES)}`, roleTitle: 'Teacher', monthlySalary: 11000 },
          { name: `${pick(MOTHERS)} ${pick(SURNAMES)}`, roleTitle: 'Assistant Teacher', monthlySalary: 8000 },
          { name: `${pick(MOTHERS)} ${pick(SURNAMES)}`, roleTitle: 'Helper (Didi)', monthlySalary: 6500 },
        ].map((row, i) => ({
          ...row,
          centreId: centre.id,
          phone: String(phoneSeq++),
          joinedOn: addDays(openedOn, i * 9),
          qualification: i < 3 ? 'Montessori trained, B.A.' : '',
        })),
      )
      .returning();

    /* fee heads */
    const heads = await db
      .insert(s.feeHeads)
      .values([
        ...programmes.map((p) => ({ centreId: centre.id, name: `Tuition fee, ${p.name}`, kind: 'monthly' as const, programmeId: p.id, amount: FEES[p.slug] ?? 2500 })),
        { centreId: centre.id, name: 'Admission fee', kind: 'one_time' as const, amount: 6000 },
        { centreId: centre.id, name: 'Annual kit and uniform', kind: 'annual' as const, amount: 3500 },
      ])
      .returning();
    const tuitionHead = (programmeId: string) => heads.find((h) => h.kind === 'monthly' && h.programmeId === programmeId)!;
    const admissionHead = heads.find((h) => h.kind === 'one_time')!;

    /* batches: one per programme */
    const batchRows = await db
      .insert(s.batches)
      .values(
        programmes.map((p, i) => ({
          centreId: centre.id,
          programmeId: p.id,
          academicYearId: year.id,
          name: `${p.name} A`,
          capacity: 12,
          timing: i < 2 ? '9:00 am to 11:30 am' : '9:00 am to 12:30 pm',
          teacherId: staffRows[1 + (i % 2)].id,
        })),
      )
      .returning();

    /* children */
    type NewStudent = typeof s.students.$inferInsert;
    const studentRows: NewStudent[] = [];
    const share = [0.2, 0.32, 0.28, 0.2];
    let admissionSeq = 0;
    programmes.forEach((p, pi) => {
      const n = Math.min(12, Math.max(2, Math.round(spec.students * share[pi])));
      for (let i = 0; i < n; i++) {
        const girl = rand() < 0.5;
        const surname = pick(SURNAMES);
        const ageMonths = p.ageFromMonths + Math.floor(rand() * (p.ageToMonths - p.ageFromMonths));
        const dob = addDays(today, -Math.round(ageMonths * 30.4));
        const monthsAgo = Math.min(spec.monthsOpen - 1, Math.floor(rand() * 7));
        const admissionDate = `${addMonths(period, -monthsAgo)}-${String(2 + Math.floor(rand() * 20)).padStart(2, '0')}`;
        admissionSeq += 1;
        studentRows.push({
          centreId: centre.id,
          admissionNo: `${centre.code}/${fy}/${String(admissionSeq).padStart(3, '0')}`,
          name: `${pick(girl ? GIRLS : BOYS)} ${surname}`,
          dob,
          gender: girl ? 'Girl' : 'Boy',
          programmeId: p.id,
          batchId: batchRows[pi].id,
          academicYearId: year.id,
          admissionDate: admissionDate > today ? today : admissionDate,
          fatherName: `${pick(FATHERS)} ${surname}`,
          motherName: `${pick(MOTHERS)} ${surname}`,
          guardianPhone: String(phoneSeq++),
          address: `${1 + Math.floor(rand() * 90)}, ${pick(STREETS)}, Kolkata`,
          bloodGroup: pick(['A+', 'B+', 'O+', 'AB+', 'O+', 'B+', '']),
          pickupPerson: rand() < 0.6 ? 'Mother' : pick(['Father', 'Grandmother', 'Pool car']),
          tshirtSize: pick(['20', '22', '24', '26']),
        });
      }
    });
    const studentsIn = await db.insert(s.students).values(studentRows).returning();

    // A few children have left, so the "left" list and retention figures are not empty.
    for (const gone of studentsIn.slice(-2)) {
      await db
        .update(s.students)
        .set({ status: 'left', leftOn: addDays(today, -20), leftReason: 'Family moved to another city' })
        .where(eqId(s.students.id, gone.id));
      gone.status = 'left';
    }

    /* one parent login per sample centre, with two children on it */
    const parentPhone = studentsIn[0].guardianPhone;
    const [parent] = await db
      .insert(s.users)
      .values({ name: studentsIn[0].motherName, username: parentPhone, phone: parentPhone, passwordHash: hash, role: 'parent', centreId: centre.id })
      .returning();
    for (const child of studentsIn.slice(0, 2)) {
      await db.update(s.students).set({ parentUserId: parent.id, guardianPhone: parentPhone }).where(eqId(s.students.id, child.id));
    }
    firstParent ??= { username: parentPhone, id: parent.id };

    /* bills and payments: admission bill + a monthly bill from the admission month to now */
    type NewInvoice = typeof s.invoices.$inferInsert;
    const invoiceRows: NewInvoice[] = [];
    const itemRows: (typeof s.invoiceItems.$inferInsert)[] = [];
    const paymentRows: (typeof s.payments.$inferInsert)[] = [];
    let invSeq = 0;
    let rctSeq = 0;
    const uid = () => crypto.randomUUID();

    for (const st of studentsIn) {
      const fee = tuitionHead(st.programmeId!).amount;
      const admitPeriod = st.admissionDate.slice(0, 7);

      const addBill = (opts: { period: string | null; title: string; issue: string; items: { headId: string; description: string; amount: number }[]; paidShare: number }) => {
        const id = uid();
        const total = opts.items.reduce((sum, it) => sum + it.amount, 0);
        const paid = Math.round(total * opts.paidShare);
        invSeq += 1;
        invoiceRows.push({
          id,
          centreId: centre.id,
          studentId: st.id,
          invoiceNo: `INV/${fy}/${String(invSeq).padStart(4, '0')}`,
          period: opts.period,
          title: opts.title,
          issueDate: opts.issue,
          dueDate: addDays(opts.issue, 9),
          subtotal: total,
          total,
          paid,
          status: invoiceStatus(total, paid),
          createdBy: centreAdmin.id,
        });
        for (const it of opts.items) itemRows.push({ invoiceId: id, feeHeadId: it.headId, description: it.description, amount: it.amount });
        if (paid > 0) {
          rctSeq += 1;
          const paidOn = addDays(opts.issue, 1 + Math.floor(rand() * 12));
          paymentRows.push({
            centreId: centre.id,
            studentId: st.id,
            invoiceId: id,
            receiptNo: `RCT/${fy}/${String(rctSeq).padStart(4, '0')}`,
            amount: paid,
            method: pick(['upi', 'upi', 'cash', 'cash', 'bank']),
            paidOn: paidOn > today ? today : paidOn,
            receivedBy: centreAdmin.id,
          });
        }
      };

      addBill({
        period: null,
        title: 'Admission',
        issue: st.admissionDate,
        items: [
          { headId: admissionHead.id, description: 'Admission fee', amount: admissionHead.amount },
          { headId: heads[heads.length - 1].id, description: 'Annual kit and uniform', amount: 3500 },
        ],
        paidShare: 1,
      });

      for (let p = admitPeriod; p <= period; p = addMonths(p, 1)) {
        if (st.status === 'left' && p === period) break;
        const age = monthsBetween(p, period); // 0 = this month
        const roll = rand();
        // Older months are nearly all paid; this month is still being collected.
        const paidShare = age >= 2 ? (roll < 0.97 ? 1 : 0) : age === 1 ? (roll < 0.86 ? 1 : roll < 0.92 ? 0.5 : 0) : roll < 0.55 ? 1 : roll < 0.62 ? 0.5 : 0;
        const issue = `${p}-01` < st.admissionDate ? st.admissionDate : `${p}-01`;
        addBill({
          period: p,
          title: `Fee for ${periodLabel(p)}`,
          issue,
          items: [{ headId: tuitionHead(st.programmeId!).id, description: `Tuition fee, ${periodLabel(p)}`, amount: fee }],
          paidShare,
        });
      }
    }
    await insertChunks(db, s.invoices, invoiceRows);
    await insertChunks(db, s.invoiceItems, itemRows);
    await insertChunks(db, s.payments, paymentRows);
    await db.insert(s.counters).values([
      { key: `${centre.id}:invoice:${fy}`, value: invSeq },
      { key: `${centre.id}:receipt:${fy}`, value: rctSeq },
      { key: `${centre.id}:admission:${fy}`, value: admissionSeq },
    ]);

    /* attendance: the last five weeks, Monday to Friday */
    const attendanceRows: (typeof s.attendance.$inferInsert)[] = [];
    for (let back = 35; back >= 0; back--) {
      const day = addDays(today, -back);
      const wd = weekday(day);
      if (wd === 0 || wd === 6) continue;
      for (const st of studentsIn) {
        if (st.status !== 'active' || st.admissionDate > day) continue;
        const roll = rand();
        attendanceRows.push({
          centreId: centre.id,
          studentId: st.id,
          batchId: st.batchId,
          day,
          status: roll < 0.9 ? 'present' : roll < 0.97 ? 'absent' : 'leave',
          markedBy: centreAdmin.id,
        });
      }
    }
    await insertChunks(db, s.attendance, attendanceRows);

    /* expenses for the last four months */
    const expenseRows: (typeof s.expenses.$inferInsert)[] = [];
    for (let back = 3; back >= 0; back--) {
      const p = addMonths(period, -back);
      const day = (d: number) => {
        const value = `${p}-${String(d).padStart(2, '0')}`;
        return value > today ? null : value;
      };
      const push = (d: number, row: Omit<typeof s.expenses.$inferInsert, 'centreId' | 'spentOn'>) => {
        const spentOn = day(d);
        if (spentOn) expenseRows.push({ ...row, centreId: centre.id, spentOn, createdBy: centreAdmin.id });
      };
      push(5, { category: 'Rent', description: `Rent for ${periodLabel(p)}`, amount: spec.rent, paidTo: 'Landlord', method: 'bank' });
      push(12, { category: 'Electricity', description: 'CESC bill', amount: 2400 + Math.floor(rand() * 900), paidTo: 'CESC', method: 'upi' });
      push(16, { category: 'Teaching material', description: 'Chart paper, crayons, clay', amount: 1200 + Math.floor(rand() * 1500), paidTo: 'Stationery shop', method: 'cash' });
      push(20, { category: 'Cleaning and upkeep', description: 'Cleaning supplies, drinking water', amount: 900 + Math.floor(rand() * 600), method: 'cash' });
      if (back > 0) {
        // Salaries are paid on the 2nd of the following month.
        const paidDay = `${addMonths(p, 1)}-02`;
        if (paidDay <= today) {
          for (const member of staffRows) {
            expenseRows.push({
              centreId: centre.id,
              category: 'Salary',
              description: `Salary for ${periodLabel(p)}, ${member.name}`,
              amount: member.monthlySalary,
              spentOn: paidDay,
              paidTo: member.name,
              method: 'bank',
              staffId: member.id,
              salaryPeriod: p,
              createdBy: centreAdmin.id,
            });
          }
        }
      }
    }
    await insertChunks(db, s.expenses, expenseRows);

    /* royalty for the last three finished months */
    for (let back = 3; back >= 1; back--) {
      const p = addMonths(period, -back);
      const { from, to } = periodRange(p);
      const basis = paymentRows.filter((pay) => pay.paidOn >= from && pay.paidOn <= to).reduce((sum, pay) => sum + pay.amount, 0);
      const amount = royaltyAmount(spec.royaltyType, spec.royaltyValue, basis);
      const paid = back > 1 ? amount : spec.royaltyType === 'fixed' ? 0 : Math.round(amount / 2);
      const [inv] = await db
        .insert(s.royaltyInvoices)
        .values({
          centreId: centre.id,
          period: p,
          basisAmount: basis,
          royaltyType: spec.royaltyType,
          royaltyValue: spec.royaltyValue,
          amount,
          paid,
          status: invoiceStatus(amount, paid),
          dueDate: `${addMonths(p, 1)}-10`,
        })
        .returning();
      if (paid > 0) {
        await db.insert(s.royaltyPayments).values({
          royaltyInvoiceId: inv.id,
          centreId: centre.id,
          amount: paid,
          method: 'bank',
          reference: `NEFT${Math.floor(100000 + rand() * 899999)}`,
          paidOn: `${addMonths(p, 1)}-09`,
          recordedBy: admin.id,
        });
      }
    }

    /* admission enquiries */
    const stages: s.EnquiryStage[] = ['new', 'new', 'contacted', 'contacted', 'visit_scheduled', 'visited', 'lost', 'new'];
    await db.insert(s.admissionEnquiries).values(
      stages.map((stage, i) => {
        const surname = pick(SURNAMES);
        const prog = pick(programmes);
        return {
          centreId: centre.id,
          childName: `${pick(rand() < 0.5 ? GIRLS : BOYS)} ${surname}`,
          dob: addDays(today, -Math.round((prog.ageFromMonths + 3) * 30.4)),
          programmeId: prog.id,
          parentName: `${pick(MOTHERS)} ${surname}`,
          phone: String(phoneSeq++),
          area: spec.area,
          message: i % 3 === 0 ? 'Please share the fee structure and timing.' : '',
          source: pick(['website', 'website', 'walk-in', 'referral', 'facebook']),
          stage,
          nextFollowUp: stage === 'lost' ? null : addDays(today, i - 2),
          visitOn: stage === 'visit_scheduled' ? addDays(today, 2) : stage === 'visited' ? addDays(today, -3) : null,
          lostReason: stage === 'lost' ? 'Chose a school closer to home' : '',
          createdAt: new Date(Date.now() - (i + 1) * 36 * 3600 * 1000),
        };
      }),
    );

    /* a notice to parents */
    await db.insert(s.announcements).values({
      audience: 'parents',
      centreId: centre.id,
      title: 'Parent-teacher meeting this Saturday',
      body: 'Dear parents, the parent-teacher meeting will be held this Saturday from 10 am to 12 noon. Please bring your child\'s diary.',
      publishOn: addDays(today, -2),
      createdBy: centreAdmin.id,
    });
  }

  // MK-002 and MK-003 were inserted above with fixed codes; move the counter past them.
  await db.update(s.counters).set({ value: 3 }).where(eq(s.counters.key, 'centre:code'));

  /* franchise leads */
  const leadStages: s.FranchiseStage[] = ['new', 'new', 'new', 'contacted', 'contacted', 'meeting', 'site_visit', 'agreement', 'lost'];
  const cities = ['Howrah', 'Barasat', 'Siliguri', 'Durgapur', 'Behala, Kolkata', 'Kalyani', 'Asansol', 'Garia, Kolkata', 'Bhubaneswar'];
  await db.insert(s.franchiseLeads).values(
    leadStages.map((stage, i) => ({
      name: `${pick([...FATHERS, ...MOTHERS])} ${pick(SURNAMES)}`,
      phone: String(phoneSeq++),
      city: cities[i],
      state: i === 8 ? 'Odisha' : 'West Bengal',
      occupation: pick(['Teacher', 'Business owner', 'Homemaker', 'IT professional', 'Retired banker']),
      investmentRange: pick(['5 to 8 lakh', '8 to 12 lakh', '12 lakh and above']),
      hasSpace: i % 3 !== 0,
      spaceSqft: i % 3 !== 0 ? 900 + i * 150 : null,
      message: i % 2 === 0 ? 'I want to open a play school in my area. Please call me.' : '',
      source: pick(['website', 'website', 'referral', 'facebook']),
      stage,
      nextFollowUp: stage === 'lost' ? null : addDays(today, i - 3),
      lostReason: stage === 'lost' ? 'Could not arrange a suitable space' : '',
      isDemo: true,
      createdAt: new Date(Date.now() - (i + 1) * 50 * 3600 * 1000),
    })),
  );

  await db.insert(s.announcements).values({
    audience: 'centres',
    title: 'Winter timetable and annual day planning',
    body: 'All schools: the winter timetable starts on the first Monday of December. Please send your annual day date and venue to head office by the 25th.',
    pinned: true,
    publishOn: addDays(today, -4),
    createdBy: admin.id,
  });

  return { parentUsername: firstParent?.username ?? '' };
}

/* tiny local helpers, kept here so the seed has no dependency on service code */
import { eq, type AnyColumn } from 'drizzle-orm';
const eqUsername = (username: string) => eq(s.users.username, username);
const eqId = (column: AnyColumn, id: string) => eq(column, id);
function monthsBetween(from: string, to: string) {
  const [y1, m1] = from.split('-').map(Number);
  const [y2, m2] = to.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
