/**
 * A student's achievements, discipline notes and health check-ups, for his
 * page (/admin/students/[id]):
 *
 *   <StudentRecords studentId={student.id} />
 *
 * A server component that loads its own data. The office sees "Add record"
 * and can remove a line; a teacher reads it for the boys of their sections;
 * anyone else gets nothing.
 */
import { Award, HeartPulse, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui/core';
import type { StudentRecord, StudentRecordKind } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getT } from '@/lib/t';
import type { Translate } from '@/i18n/ui';
import { LEVEL_LABELS, RECORD_KIND_LABELS, type Level } from '@/server/office/labels';
import { recordFields, recordsOfStudent } from '@/server/office/records';
import { isOffice } from '@/server/school/access';
import { DeleteRecordButton, RecordFormButton } from './student-record-form';

export const RECORD_ICONS: Record<StudentRecordKind, ReactNode> = {
  achievement: <Award size={16} />,
  discipline: <ShieldAlert size={16} />,
  health: <HeartPulse size={16} />,
};
export const RECORD_TONES = { achievement: 'green', discipline: 'amber', health: 'blue' } as const;

/** What a record says, in a line or two. */
export function RecordDetails({ record, t }: { record: Pick<StudentRecord, 'kind' | 'data'>; t: Translate }) {
  const f = recordFields(record);
  if (record.kind === 'achievement') {
    return (
      <div>
        <p className="font-medium text-ink-900">{f.competition}</p>
        <p className="text-sm text-ink-600">{[f.level ? t(LEVEL_LABELS[f.level as Level] ?? f.level) : '', f.position].filter(Boolean).join(' · ')}</p>
        {f.note ? <p className="text-sm text-ink-500">{f.note}</p> : null}
      </div>
    );
  }
  if (record.kind === 'discipline') {
    return (
      <div>
        <p className="text-ink-900">{f.incident}</p>
        {f.action ? <p className="text-sm text-ink-600">{t('Action: {text}', { text: f.action })}</p> : null}
        <p className="text-xs text-ink-500">{f.guardianInformed ? t('Guardian informed') : t('Guardian not informed')}</p>
      </div>
    );
  }
  const parts = [
    f.heightCm !== null ? t('Height {n} cm', { n: f.heightCm }) : '',
    f.weightKg !== null ? t('Weight {n} kg', { n: f.weightKg }) : '',
    f.bmi !== null ? t('BMI {n}', { n: f.bmi }) : '',
    f.vision ? t('Vision {text}', { text: f.vision }) : '',
    f.dental ? t('Teeth {text}', { text: f.dental }) : '',
  ].filter(Boolean);
  return (
    <div>
      <p className="tabular text-ink-900">{parts.join(' · ')}</p>
      {f.remarks ? <p className="text-sm text-ink-500">{f.remarks}</p> : null}
    </div>
  );
}

export async function StudentRecords({ studentId, studentName }: { studentId: string; studentName?: string }) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'staff' && session.role !== 'teacher')) return null;
  const t = await getT();
  let rows: StudentRecord[];
  try {
    rows = await recordsOfStudent(session, studentId);
  } catch {
    return null;
  }
  const office = isOffice(session);
  return (
    <Card>
      <CardHeader
        title={t('Records')}
        description={t('Achievements, discipline notes and health check-ups.')}
        action={office ? <RecordFormButton student={{ id: studentId, name: studentName ?? '' }} /> : undefined}
      />
      {rows.length ? (
        <ul className="divide-y divide-ink-100 px-5 pb-2 pt-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 py-3">
              <Badge tone={RECORD_TONES[row.kind]} className="mt-0.5 shrink-0">
                {RECORD_ICONS[row.kind]} {t(RECORD_KIND_LABELS[row.kind])}
              </Badge>
              <div className="min-w-0 flex-1">
                <RecordDetails record={row} t={t} />
                <p className="mt-0.5 text-xs text-ink-400">{[formatDate(row.day), row.createdByName].filter(Boolean).join(' · ')}</p>
              </div>
              {office ? <DeleteRecordButton id={row.id} /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-8" title={t('No records yet')} text={t('Prizes, discipline notes and health check-ups of this student show here.')} />
      )}
    </Card>
  );
}
