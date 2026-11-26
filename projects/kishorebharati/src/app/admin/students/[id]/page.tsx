import { Award, ClipboardCheck, FileCheck2, Gift, IdCard, IndianRupee, Library, Pencil } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, Badge, Card, CardBody, CardHeader, Detail, LinkButton, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { gradeLabel, sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate, formatDateTime, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { BENEFIT_STATUS_LABELS, CATEGORY_LABELS, CERTIFICATE_LABELS, GENDER_LABELS, RESULT_LABELS, STUDENT_STATUS_LABELS } from '@/server/students/constants';
import { getStudent } from '@/server/students/service';
import { StudentRecords } from '@/components/school/student-records';
import { ContactLinks } from '../../_ui/bits';
import { BackOnRoll, MarkLeft, ParentLogin, StudentPhoto, TrashStudent, UnlinkParent } from './student-tools';

export const metadata: Metadata = { title: 'Student' };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const found = await getStudent(session, id);
  if (!found) notFound();
  const { student, history, current, parent, siblings } = found;
  const office = isOffice(session);
  const empty = t('Not added');
  const label = (row: { grade: number; sectionName: string; stream: '' | 'science' | 'arts'; shift: 'morning' | 'day' }) =>
    sectionLabel({ grade: row.grade, name: row.sectionName, stream: row.stream, shift: row.shift }, lang);

  // Other modules' screens for this student; each reads ?student= (see docs/modules/students.md).
  const records = [
    { href: `/admin/attendance?student=${student.id}`, label: t('Attendance'), icon: ClipboardCheck, show: true },
    { href: `/admin/exams?student=${student.id}`, label: t('Exams and results'), icon: FileCheck2, show: true },
    { href: `/admin/fees?student=${student.id}`, label: t('Fees'), icon: IndianRupee, show: office },
    { href: `/admin/library?student=${student.id}`, label: t('Library'), icon: Library, show: office },
  ].filter((item) => item.show);

  return (
    <>
      <PageHeader
        title={student.name}
        back={{ href: '/admin/students', label: t('Students') }}
        actions={
          office ? (
            <>
              <LinkButton href={`/admin/students/id-cards?ids=${student.id}`} variant="secondary" size="sm">
                <IdCard size={15} /> {t('ID card')}
              </LinkButton>
              <LinkButton href={`/admin/certificates/new?student=${student.id}`} variant="secondary" size="sm">
                <Award size={15} /> {t('Certificate')}
              </LinkButton>
              <LinkButton href={`/admin/students/${student.id}/edit`} size="sm">
                <Pencil size={15} /> {t('Edit')}
              </LinkButton>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardBody className="flex flex-wrap items-start gap-5">
              {office ? (
                <div className="w-full sm:w-72 sm:shrink-0">
                  <StudentPhoto id={student.id} photo={student.photo} />
                </div>
              ) : (
                <Avatar name={student.name} src={student.photo} size={96} />
              )}
              <div className="min-w-0 flex-1 basis-60 space-y-1">
                {student.nameBn ? <p className="text-lg font-semibold text-ink-800">{student.nameBn}</p> : null}
                <p className="text-[15px] text-ink-700">
                  {current ? `${label(current)} · ${t('Roll {n}', { n: current.rollNo })}` : t('No class this year')}
                </p>
                <p className="tabular text-sm text-ink-500">{t('Admission number {no}', { no: student.admissionNo })}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <StatusBadge status={student.status} label={t(STUDENT_STATUS_LABELS[student.status])} />
                  {student.status !== 'active' && student.leftOn ? (
                    <span className="text-sm text-ink-500">
                      {formatDate(student.leftOn)}
                      {student.leftReason ? ` · ${student.leftReason}` : ''}
                    </span>
                  ) : null}
                </div>
                {office ? (
                  <div className="no-print flex flex-wrap gap-2 pt-3">
                    {student.status === 'active' ? <MarkLeft id={student.id} name={student.name} today={todayIST()} /> : <BackOnRoll id={student.id} />}
                    {isAdmin(session) ? <TrashStudent id={student.id} name={student.name} /> : null}
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Details')} />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t('Date of birth')} empty={empty}>{student.dob ? formatDate(student.dob) : ''}</Detail>
                <Detail label={t('Gender')} empty={empty}>{t(GENDER_LABELS[student.gender])}</Detail>
                <Detail label={t('Category')} empty={empty}>{t(CATEGORY_LABELS[student.category])}</Detail>
                <Detail label={t('Religion')} empty={empty}>{student.religion}</Detail>
                <Detail label={t('Blood group')} empty={empty}>{student.bloodGroup}</Detail>
                <Detail label={t('Banglar Shiksha ID')} empty={empty}>{student.portalId}</Detail>
                <Detail label={t('Admission date')} empty={empty}>{student.admittedOn ? formatDate(student.admittedOn) : ''}</Detail>
                <Detail label={t('Admitted in')} empty={empty}>{student.admittedGrade !== null ? gradeLabel(student.admittedGrade, lang) : ''}</Detail>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Family')} action={<ContactLinks phone={student.phone} email={student.email} labels />} />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t("Father's name")} empty={empty}>{student.fatherName}</Detail>
                <Detail label={t("Mother's name")} empty={empty}>{student.motherName}</Detail>
                <Detail label={t('Guardian')} empty={empty}>{[student.guardianName, student.guardianRelation].filter(Boolean).join(', ')}</Detail>
                <Detail label={t('Guardian mobile')} empty={empty}>{student.phone}</Detail>
                <Detail label={t('Other mobile')} empty={empty}>{student.altPhone}</Detail>
                <Detail label={t('Email')} empty={empty}>{student.email}</Detail>
                <Detail label={t('Home address')} empty={empty} className="sm:col-span-2 lg:col-span-3">{student.address}</Detail>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Year by year')} description={t('His class, roll number and result in each school year.')} />
            {history.length ? (
              <Table className="mt-3">
                <thead>
                  <tr>
                    <Th>{t('Year')}</Th>
                    <Th>{t('Class')}</Th>
                    <Th>{t('Roll')}</Th>
                    <Th>{t('Result')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <Tr key={row.enrolmentId}>
                      <Td className="tabular font-semibold">{row.yearName}</Td>
                      <Td>{label(row)}</Td>
                      <Td className="tabular">{row.rollNo}</Td>
                      <Td>{row.result ? <StatusBadge status={row.result} label={t(RESULT_LABELS[row.result])} /> : <span className="text-ink-400">{t('Year running')}</span>}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <CardBody className="text-sm text-ink-500">{t('Not placed in any class yet.')}</CardBody>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {office ? (
            <Card>
              <CardHeader title={t('Parent login')} description={t('For the parents’ corner: attendance, diary, results and fees of their sons.')} />
              <CardBody className="space-y-3">
                {parent ? (
                  <>
                    <p className="text-[15px] text-ink-800">
                      {t('Username')}: <span className="tabular font-semibold">{parent.username}</span>{' '}
                      {!parent.active ? <Badge tone="neutral">{t('Switched off')}</Badge> : parent.mustChangePassword ? <Badge tone="amber">{t('Not logged in yet')}</Badge> : null}
                    </p>
                    {parent.lastLoginAt ? <p className="text-sm text-ink-500">{t('Last login {when}', { when: formatDateTime(parent.lastLoginAt) })}</p> : null}
                    {siblings.length ? (
                      <p className="text-sm text-ink-600">
                        {t('Also on this login')}:{' '}
                        {siblings.map((s, i) => (
                          <span key={s.id}>
                            {i ? ', ' : ''}
                            <Link href={`/admin/students/${s.id}`} className="font-semibold text-brand-700 hover:underline">
                              {s.name}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-ink-600">{student.phone ? t('No parent login yet.') : t('Add the guardian mobile number first. It is the username.')}</p>
                )}
                <div className="no-print flex flex-wrap gap-2">
                  <ParentLogin id={student.id} phone={student.phone} hasLogin={Boolean(parent)} />
                  {parent ? <UnlinkParent id={student.id} /> : null}
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title={t('Other records')} />
            <ul className="mt-2 divide-y divide-ink-100 pb-2">
              {records.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-3 text-[15px] font-medium text-ink-800 hover:bg-brand-50/50">
                    <item.icon size={18} className="text-brand-700" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {office ? (
            <Card>
              <CardHeader
                title={t('Certificates')}
                action={
                  <LinkButton href={`/admin/certificates/new?student=${student.id}`} variant="ghost" size="sm">
                    {t('Issue')}
                  </LinkButton>
                }
              />
              {found.certificates.length ? (
                <ul className="mt-2 divide-y divide-ink-100 pb-2">
                  {found.certificates.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <Link href={`/admin/certificates/${c.id}`} className="min-w-0">
                        <span className="block font-semibold text-ink-900 hover:text-brand-700">{t(CERTIFICATE_LABELS[c.kind])}</span>
                        <span className="tabular block text-xs text-ink-500">
                          {c.serialNo} · {formatDate(c.issuedOn)}
                        </span>
                      </Link>
                      {c.voidedAt ? <StatusBadge status="voided" label={t('Void')} /> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <CardBody className="text-sm text-ink-500">{t('None issued yet.')}</CardBody>
              )}
            </Card>
          ) : null}

          {office ? (
            <Card>
              <CardHeader
                title={t('Government schemes')}
                action={
                  <LinkButton href={`/admin/schemes?q=${encodeURIComponent(student.admissionNo)}`} variant="ghost" size="sm">
                    <Gift size={15} /> {t('Open')}
                  </LinkButton>
                }
              />
              {found.benefits.length ? (
                <ul className="mt-2 divide-y divide-ink-100 pb-2">
                  {found.benefits.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink-900">{b.scheme}</span>
                        <span className="tabular block text-xs text-ink-500">
                          {b.year}
                          {b.amount ? ` · ${inr(b.amount)}` : ''}
                        </span>
                      </span>
                      <StatusBadge status={b.status} label={t(BENEFIT_STATUS_LABELS[b.status])} />
                    </li>
                  ))}
                </ul>
              ) : (
                <CardBody className="text-sm text-ink-500">{t('None entered yet.')}</CardBody>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
