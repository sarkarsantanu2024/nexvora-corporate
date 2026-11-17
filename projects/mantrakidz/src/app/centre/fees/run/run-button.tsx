'use client';

import { useRouter } from 'next/navigation';
import { ConfirmButton, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { runMonthlyAction } from '@/server/centre/money/actions';

export function RunButton({ month, label, count, amount }: { month: string; label: string; count: number; amount: number }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      variant="primary"
      size="lg"
      danger={false}
      disabled={count === 0}
      title={count === 1 ? t('Raise {count} bill for {label}?', { count, label }) : t('Raise {count} bills for {label}?', { count, label })}
      text={count === 1 ? t('{count} child will be billed {amount} in all. Children who already have a {label} bill are not billed again.', { count, amount: inr(amount), label }) : t('{count} children will be billed {amount} in all. Children who already have a {label} bill are not billed again.', { count, amount: inr(amount), label })}
      confirmLabel={t('Raise bills')}
      onConfirm={async () => {
        const result = await runMonthlyAction(month);
        if (!result.ok) {
          toast.error(t(result.error));
          return;
        }
        toast.success(result.data.created ? (result.data.created === 1 ? t('{n} bill raised for {label}', { n: result.data.created, label }) : t('{n} bills raised for {label}', { n: result.data.created, label })) : t('Every child already has a bill'));
        router.refresh();
      }}
    >
      {count === 0 ? t('Nothing to raise') : t('Raise bills')}
    </ConfirmButton>
  );
}
