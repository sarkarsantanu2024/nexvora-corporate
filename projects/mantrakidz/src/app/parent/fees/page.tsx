import { Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardBody, CardHeader, EmptyState, Notice, PageHeader, StatusBadge } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { waLink } from '@/lib/wa';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { listChildren, listFees, listPayInfo } from '@/server/parent/service';
import { PayInfo } from '../../centre/fees/pay-info';
import { WhatsAppLink } from '../../centre/fees/pickers';

export const metadata: Metadata = { title: 'Fees' };

export default async function ParentFees() {
  const session = await requireSession(['parent']);
  const [children, bills, payInfo] = await Promise.all([listChildren(session), listFees(session), listPayInfo(session)]);
  const today = todayIST();
  const due = children.reduce((sum, child) => sum + child.due, 0);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Fees" description="Bills from the centre and the receipts for what you have paid." />

      <Card className={`mb-5 p-5 ${due > 0 ? 'border-accent-200 bg-accent-50' : 'border-mint-100 bg-mint-50'}`}>
        <p className="text-sm font-semibold text-ink-700">{due > 0 ? 'Amount due' : 'Nothing due'}</p>
        <p className={`tabular mt-1 font-display text-3xl font-bold ${due > 0 ? 'text-accent-600' : 'text-mint-700'}`}>{due > 0 ? inr(due) : 'All paid'}</p>
      </Card>

      {payInfo.map((centre) => (
        <Card key={centre.centreId} className="mb-5">
          <CardHeader title={`How to pay ${inr(centre.due)}`} description={`${centre.centreName} · for ${centre.bills}`} />
          <CardBody>
            {centre.ready ? (
              <PayInfo details={centre.details} amount={centre.due} note={centre.bills} centreName={centre.centreName} upiLink="always">
                <p className="mt-4 text-sm text-ink-600">
                  After paying, send the screenshot to the centre on WhatsApp; your receipt appears here once the centre records it. You can also pay at the centre
                  office.
                </p>
                <div className="mt-3">
                  <WhatsAppLink
                    href={waLink(centre.contact, `Hello, I have paid ${inr(centre.due)} towards ${centre.bills}. The screenshot is attached. ${session.name}`)}
                    label="Send screenshot on WhatsApp"
                    size="md"
                  />
                </div>
              </PayInfo>
            ) : (
              <p className="text-[15px] text-ink-600">Pay at the centre office; your receipt appears here.</p>
            )}
          </CardBody>
        </Card>
      ))}

      {due <= 0 ? (
        <Notice tone="blue" className="mb-5">
          Pay at the centre office; your receipt appears here.
        </Notice>
      ) : null}

      {children.map((child) => {
        const own = bills.filter((bill) => bill.studentId === child.id);
        return (
          <Card key={child.id} className="mb-5 overflow-hidden">
            <CardHeader title={child.name} description={child.batchName ?? undefined} />
            {own.length ? (
              <ul className="mt-3 divide-y divide-ink-100">
                {own.map((bill) => {
                  const open = bill.status === 'unpaid' || bill.status === 'partial';
                  return (
                    <li key={bill.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{bill.title}</p>
                          <p className="text-xs text-ink-500">
                            Bill {bill.invoiceNo} · {formatDate(bill.issueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tabular font-display text-lg font-bold text-ink-900">{inr(bill.total)}</p>
                          <StatusBadge status={bill.status} label={bill.status === 'partial' ? 'Part paid' : undefined} />
                        </div>
                      </div>
                      {open ? (
                        <p className={`mt-2 text-sm font-medium ${bill.dueDate < today ? 'text-accent-600' : 'text-ink-600'}`}>
                          {inr(bill.total - bill.paid)} to pay by {formatDate(bill.dueDate)}
                        </p>
                      ) : null}
                      {bill.receipts.length ? (
                        <ul className="mt-2 space-y-1.5">
                          {bill.receipts.map((receipt) => (
                            <li key={receipt.id}>
                              <Link
                                href={`/parent/fees/receipts/${receipt.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2 text-sm transition hover:bg-brand-50"
                              >
                                <span className="flex min-w-0 items-center gap-2 text-ink-700">
                                  <Receipt size={16} className="shrink-0 text-brand-600" />
                                  <span className="truncate">
                                    Paid {formatDate(receipt.paidOn)} by {METHOD_LABELS[receipt.method]}
                                  </span>
                                </span>
                                <span className="tabular shrink-0 font-semibold text-brand-700">{inr(receipt.amount)} · Receipt</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No bills yet" text="When the centre raises a bill for your child, it shows here." className="py-10" />
            )}
          </Card>
        );
      })}

      {children.length === 0 ? (
        <Card>
          <EmptyState icon={<Receipt size={26} />} title="No child is linked to this login yet" text="Please ask the centre office to link your child to your mobile number." />
        </Card>
      ) : null}
    </div>
  );
}
