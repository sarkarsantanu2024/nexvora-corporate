import { IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/client';
import { Badge, Card, CardBody, CardHeader, Detail, LinkButton, Notice, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { getBill } from '@/server/centre/money/bills';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { hasPaymentDetails, paymentDetailsOf } from '@/server/centre/money/payment-info';
import { PrintHeading } from '../../daybook-tab';
import { PayInfo } from '../../pay-info';
import { BillActions } from './bill-actions';

export const metadata: Metadata = { title: 'Bill' };

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCentre();
  const { id } = await params;
  const bill = await getBill(ctx, id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const inv = bill.invoice;
  const manager = canManageCentre(ctx.session);
  const open = inv.status === 'unpaid' || inv.status === 'partial';
  const balance = inv.status === 'cancelled' ? 0 : Math.max(0, inv.total - inv.paid);
  const late = open && inv.dueDate < todayIST();
  const pay = paymentDetailsOf(ctx.centre);
  const hasLiveReceipt = bill.receipts.some((r) => !r.voidedAt);

  return (
    <div className="animate-fade-up">
      <div className="no-print">
        <PageHeader
          title={`Bill ${inv.invoiceNo}`}
          description={`${inv.title} · ${bill.studentName}`}
          back={{ href: '/centre/fees', label: 'Fees' }}
          actions={
            <>
              {open ? (
                <LinkButton href={`/centre/fees/collect?student=${inv.studentId}`}>
                  <IndianRupee size={18} /> Take payment
                </LinkButton>
              ) : null}
              <PrintButton />
              {manager && open ? <BillActions id={inv.id} subtotal={inv.subtotal} discount={inv.discount} paid={inv.paid} canCancel={!hasLiveReceipt} /> : null}
            </>
          }
        />
      </div>
      <PrintHeading centre={ctx.centre.name} title={`Bill ${inv.invoiceNo}`} sub={[ctx.centre.address, ctx.centre.area, ctx.centre.city].filter(Boolean).join(', ')} />

      {inv.status === 'cancelled' ? (
        <Notice tone="amber" className="mb-4">
          This bill is cancelled. It is not owed and is left out of every total.
        </Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 print-plain">
          <CardHeader title="What it is for" action={<StatusBadge status={inv.status} label={inv.status === 'partial' ? 'Part paid' : undefined} />} />
          <div className="mt-4">
            <Table className="!min-w-0">
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.description}</Td>
                    <Td className="tabular text-right">{inr(item.amount)}</Td>
                  </Tr>
                ))}
                {inv.discount > 0 ? (
                  <>
                    <tr>
                      <Td className="text-right text-ink-500">Subtotal</Td>
                      <Td className="tabular text-right">{inr(inv.subtotal)}</Td>
                    </tr>
                    <tr>
                      <Td className="text-right text-ink-500">Discount</Td>
                      <Td className="tabular text-right">- {inr(inv.discount)}</Td>
                    </tr>
                  </>
                ) : null}
                <tr>
                  <Td className="text-right font-semibold">Total</Td>
                  <Td className="tabular text-right text-base font-bold">{inr(inv.total)}</Td>
                </tr>
                <tr>
                  <Td className="text-right text-ink-500">Received</Td>
                  <Td className="tabular text-right">{inr(inv.paid)}</Td>
                </tr>
                <tr>
                  <Td className="text-right font-semibold">Balance</Td>
                  <Td className={`tabular text-right text-base font-bold ${balance > 0 ? 'text-accent-600' : 'text-mint-700'}`}>{inr(balance)}</Td>
                </tr>
              </tbody>
            </Table>
          </div>
          {inv.notes ? <p className="whitespace-pre-line border-t border-ink-100 px-5 py-4 text-sm text-ink-600">{inv.notes}</p> : null}
        </Card>

        <Card className="print-plain">
          <CardHeader title="Details" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Child" className="col-span-2">
                <Link href={`/centre/students/${inv.studentId}`} className="font-semibold text-brand-700 hover:underline">
                  {bill.studentName}
                </Link>
              </Detail>
              <Detail label="Class">{bill.batchName}</Detail>
              <Detail label="Admission no">{bill.admissionNo}</Detail>
              <Detail label="Bill date">{formatDate(inv.issueDate)}</Detail>
              <Detail label="Due date">
                <span className={late ? 'font-semibold text-accent-600' : ''}>{formatDate(inv.dueDate)}</span>
              </Detail>
              <Detail label="Mobile">{bill.guardianPhone}</Detail>
            </dl>
          </CardBody>
        </Card>
      </div>

      {open && hasPaymentDetails(pay) ? (
        <Card className="mt-5 print-plain">
          <CardHeader title="How to pay" description={`${inr(balance)} to pay. After paying, send the screenshot to the centre on WhatsApp.`} />
          <CardBody>
            <PayInfo details={pay} amount={balance} note={inv.invoiceNo} centreName={ctx.centre.name} upiLink="without-qr" />
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-5 overflow-hidden print-plain">
        <CardHeader title="Receipts against this bill" />
        <div className="mt-4">
          {bill.receipts.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Receipt</Th>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th>Reference</Th>
                  <Th>Received by</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {bill.receipts.map((r) => (
                  <Tr key={r.id} className={r.voidedAt ? 'text-ink-400' : ''}>
                    <Td>
                      <Link href={`/centre/fees/receipts/${r.id}`} className="whitespace-nowrap font-semibold text-brand-700 hover:underline">
                        {r.receiptNo}
                      </Link>
                      {r.voidedAt ? (
                        <Badge tone="red" className="ml-2" title={r.voidReason}>
                          Void
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(r.paidOn)}</Td>
                    <Td>{METHOD_LABELS[r.method]}</Td>
                    <Td>{r.reference}</Td>
                    <Td>{r.receivedBy}</Td>
                    <Td className={`tabular text-right font-semibold ${r.voidedAt ? 'line-through' : ''}`}>{inr(r.amount)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="px-5 pb-5 text-sm text-ink-500">Nothing received on this bill yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
