/** The overview tile "Present today": the share of students present across the sections already taken. */
import { ClipboardCheck } from 'lucide-react';
import { Stat } from '@/components/ui/core';
import { getT } from '@/lib/t';
import { presentToday } from '@/server/attendance/service';

export async function PresentTodayTile() {
  const t = await getT();
  const today = await presentToday();
  return (
    <Stat
      label={t('Present today')}
      value={today.percent === null ? '–' : `${today.percent}%`}
      hint={today.marked ? t('{present} of {marked} students, {sections} sections taken', { present: today.present, marked: today.marked, sections: today.sectionsMarked }) : t('No register taken yet today')}
      icon={<ClipboardCheck size={18} />}
      tone={today.percent === null ? 'neutral' : today.percent < 75 ? 'amber' : 'green'}
      href="/admin/attendance"
    />
  );
}
