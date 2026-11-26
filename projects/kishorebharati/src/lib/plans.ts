/**
 * The plans a client can buy, in order. Safe to use in the browser (the menu
 * hides screens above the plan); the server side is src/server/platform.ts.
 *
 *   website   the website and its enquiries
 *   panel     plus the edit panel: website text, photos, gallery, notices, reminders
 *   platinum  plus the business management screens of this client
 */
export const PLANS = ['website', 'panel', 'platinum'] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<Plan, string> = {
  website: 'Website',
  panel: 'Website and edit panel',
  platinum: 'Platinum',
};

export const isPlan = (value: unknown): value is Plan => (PLANS as readonly unknown[]).includes(value);

export const planAllows = (have: Plan, need: Plan) => PLANS.indexOf(have) >= PLANS.indexOf(need);

/** Who to ask about the plan or a paused account. */
export const PLATFORM_CONTACT = { name: 'Nexvora Technologies', phone: '9804243159' };
