'use client';

import { useRouter } from 'next/navigation';
import { ConfirmButton, useToast } from '@/components/ui/client';
import { inr } from '@/lib/money';
import { runMonthlyAction } from '@/server/centre/money/actions';

export function RunButton({ month, label, count, amount }: { month: string; label: string; count: number; amount: number }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      variant="primary"
      size="lg"
      danger={false}
      disabled={count === 0}
      title={`Raise ${count} ${count === 1 ? 'bill' : 'bills'} for ${label}?`}
      text={`${count} ${count === 1 ? 'child' : 'children'} will be billed ${inr(amount)} in all. Children who already have a ${label} bill are not billed again.`}
      confirmLabel="Raise bills"
      onConfirm={async () => {
        const result = await runMonthlyAction(month);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(result.data.created ? `${result.data.created} ${result.data.created === 1 ? 'bill' : 'bills'} raised for ${label}` : 'Every child already has a bill');
        router.refresh();
      }}
    >
      {count === 0 ? 'Nothing to raise' : 'Raise bills'}
    </ConfirmButton>
  );
}
