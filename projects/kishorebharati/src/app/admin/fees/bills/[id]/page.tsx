import { IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/client';
import { Badge, Card, CardBody, CardHeader, Detail, LinkButton, Notice, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { getBill } from '@/server/money/bills';
import { BILL_STATUS_LABELS, METHOD_LABELS, hasPaymentDetails } from '@/server/money/labels';
import { getPaymentDetails, schoolHeader } from '@/server/money/shared';
import { requirePlan } from '@/server/platform';
import { PayInfo } from '../../pay-info';
import { SchoolPrintHeader } from '../../print-header';
import { billName, classOf } from '../../shared';
import { BillActions } from './bill-actions';

export const metadata: Metadata = { title: 'Bill' };

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const bill = await getBill(session, id);
  if (!bill) notFound();
  const inv = bill.invoice;
  const open = inv.status === 'unpaid' || inv.status === 'partial';
  const balance = inv.status === 'cancelled' ? 0 : Math.max(0, inv.total - inv.paid);
  const late = open && inv.dueDate < todayIST();
  const [pay, school] = await Promise.all([getPaymentDetails(), schoolHeader()]);
  const hasLiveReceipt = bill.receipts.some((r) => !r.voidedAt);
  const name = billName(inv, t);

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={t('Bill {invoiceNo}', { invoiceNo: inv.invoiceNo })}
          description={`${name} · ${bill.studentName}`}
          back={{ href: '/admin/fees?tab=bills', label: t('Bills') }}
          actions={
            <>
              {open ? (
                <LinkButton href={`/admin/fees/collect?student=${inv.studentId}`}>
                  <IndianRupee size={18} /> {t('Take payment')}
                </LinkButton>
              ) : null}
              <PrintButton />
              {isAdmin(session) && open ? <BillActions id={inv.id} subtotal={inv.subtotal} discount={inv.discount} paid={inv.paid} canCancel={!hasLiveReceipt} /> : null}
            </>
          }
        />
      </div>
      <SchoolPrintHeader onlyOnPaper title={t('Bill {invoiceNo}', { invoiceNo: inv.invoiceNo })} sub={formatDate(inv.issueDate)} />

      {inv.status === 'cancelled' ? (
        <Notice tone="amber" className="mb-4">
          {t('This bill is cancelled. Nobody owes it, and it is left out of every total.')}
        </Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="print-plain lg:col-span-2">
          <CardHeader title={name} action={<StatusBadge status={inv.status} label={t(BILL_STATUS_LABELS[inv.status])} />} />
          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>{t('Item')}</Th>
                  <Th className="text-right">{t('Amount')}</Th>
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
                    <Tr>
                      <Td className="text-ink-500">{t('Subtotal')}</Td>
                      <Td className="tabular text-right">{inr(inv.subtotal)}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-ink-500">{t('Concession')}</Td>
                      <Td className="tabular text-right">- {inr(inv.discount)}</Td>
                    </Tr>
                  </>
                ) : null}
                <Tr>
                  <Td className="font-semibold">{t('Total')}</Td>
                  <Td className="tabular text-right text-base font-bold">{inr(inv.total)}</Td>
                </Tr>
                <Tr>
                  <Td className="text-ink-500">{t('Received')}</Td>
                  <Td className="tabular text-right">{inr(inv.paid)}</Td>
                </Tr>
                <Tr>
                  <Td className="font-semibold">{t('Balance')}</Td>
                  <Td className={`tabular text-right text-base font-bold ${balance > 0 ? 'text-accent-600' : 'text-mint-700'}`}>{inr(balance)}</Td>
                </Tr>
              </tbody>
            </Table>
          </div>
          {inv.notes ? <p className="whitespace-pre-line border-t border-ink-100 px-5 py-4 text-sm text-ink-600">{inv.notes}</p> : null}
        </Card>

        <Card className="print-plain">
          <CardHeader title={t('Details')} />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Detail empty={t('Not added')} label={t('Student')} className="col-span-2">
                <Link href={`/admin/fees?tab=bills&student=${inv.studentId}`} className="font-semibold text-brand-700 hover:underline">
                  {bill.studentName}
                </Link>
              </Detail>
              <Detail empty={t('Not added')} label={t('Class')}>{classOf(bill, lang)}</Detail>
              <Detail empty={t('Not added')} label={t('Roll')}>{bill.rollNo ? String(bill.rollNo) : ''}</Detail>
              <Detail empty={t('Not added')} label={t('Admission no')}>{bill.admissionNo}</Detail>
              <Detail empty={t('Not added')} label={t('Mobile')}>{bill.phone}</Detail>
              <Detail empty={t('Not added')} label={t('Bill date')}>{formatDate(inv.issueDate)}</Detail>
              <Detail empty={t('Not added')} label={t('Due date')}>
                <span className={late ? 'font-semibold text-accent-600' : ''}>{formatDate(inv.dueDate)}</span>
              </Detail>
            </dl>
          </CardBody>
        </Card>
      </div>

      {open && hasPaymentDetails(pay) ? (
        <Card className="print-plain mt-5">
          <CardHeader title={t('How to pay')} description={t('{balance} to pay. After paying, send the screenshot to the school on WhatsApp.', { balance: inr(balance) })} />
          <CardBody>
            <PayInfo details={pay} amount={balance} note={inv.invoiceNo} payee={school.name} upiLink="without-qr" />
          </CardBody>
        </Card>
      ) : null}

      <Card className="no-print mt-5 overflow-hidden">
        <CardHeader title={t('Receipts against this bill')} />
        <div className="mt-4">
          {bill.receipts.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Receipt')}</Th>
                  <Th>{t('Date')}</Th>
                  <Th>{t('Method')}</Th>
                  <Th>{t('Reference')}</Th>
                  <Th>{t('Received by')}</Th>
                  <Th className="text-right">{t('Amount')}</Th>
                </tr>
              </thead>
              <tbody>
                {bill.receipts.map((r) => (
                  <Tr key={r.id} className={r.voidedAt ? 'text-ink-400' : ''}>
                    <Td>
                      <Link href={`/admin/fees/receipts/${r.id}`} className="tabular whitespace-nowrap font-semibold text-brand-700 hover:underline">
                        {r.receiptNo}
                      </Link>
                      {r.voidedAt ? (
                        <Badge tone="red" className="ml-2" title={r.voidReason}>
                          {t('Void')}
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(r.paidOn)}</Td>
                    <Td>{t(METHOD_LABELS[r.method])}</Td>
                    <Td>{r.reference}</Td>
                    <Td>{r.receivedBy}</Td>
                    <Td className={`tabular text-right font-semibold ${r.voidedAt ? 'line-through' : ''}`}>{inr(r.amount)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="px-5 pb-5 text-sm text-ink-500">{t('Nothing received on this bill yet.')}</p>
          )}
        </div>
      </Card>
    </>
  );
}
