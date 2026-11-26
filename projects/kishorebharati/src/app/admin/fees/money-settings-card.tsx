import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/core';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { libraryRules } from '@/server/library/service';
import { expenseCategories } from '@/server/money/expenses';
import { feeSettings } from '@/server/money/shared';
import { LibraryRulesForm } from '../library/library-settings';
import { ExpenseCategoriesForm, FeeSettingsForm } from './money-settings';

/** The money and library cards of the Settings screen. */
export async function MoneySettingsCards() {
  const t = await getT();
  const [fees, categories, rules] = await Promise.all([feeSettings(), expenseCategories(), libraryRules()]);
  return (
    <>
      <Card id="fees">
        <CardHeader
          title={t('Fees')}
          description={rich(t('The fee amounts are the fee heads, and how parents pay is the payment details: both are on the {link} screen.'), {
            link: (
              <Link href="/admin/fees?tab=heads" className="font-semibold text-brand-700 hover:underline">
                {t('Fees')}
              </Link>
            ),
          })}
        />
        <CardBody>
          <FeeSettingsForm initial={fees} />
        </CardBody>
      </Card>
      <Card id="expenses">
        <CardHeader title={t('Expense categories')} description={t('The list the office picks from when it writes down an expense.')} />
        <CardBody>
          <ExpenseCategoriesForm initial={categories} />
        </CardBody>
      </Card>
      <Card id="library">
        <CardHeader title={t('Library rules')} />
        <CardBody>
          <LibraryRulesForm initial={rules} />
        </CardBody>
      </Card>
    </>
  );
}
