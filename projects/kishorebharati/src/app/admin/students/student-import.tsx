'use client';

/** The admission register from a spreadsheet. Column labels are English; the import screen translates them. */
import { ImportButton } from '@/components/ui/import';
import { useT } from '@/components/ui/lang';
import { importStudentsAction } from '@/server/students/actions';

export function StudentImport() {
  const t = useT();
  return (
    <ImportButton
      title={t('Import students')}
      description={t('One row per student with the class, section and roll number of this year. A blank admission number gets the next number; a row with an admission number already used is left out.')}
      onImport={importStudentsAction}
      fields={[
        { key: 'name', label: 'Name', required: true, aliases: ['student name', 'name of student', 'full name', 'student'] },
        { key: 'grade', label: 'Class', required: true, aliases: ['class no', 'standard', 'std', 'grade'] },
        { key: 'section', label: 'Section', aliases: ['sec', 'division'] },
        { key: 'stream', label: 'Stream', aliases: ['group'] },
        { key: 'rollNo', label: 'Roll number', aliases: ['roll', 'roll no', 'rollno'] },
        { key: 'admissionNo', label: 'Admission number', aliases: ['admission no', 'adm no', 'reg no', 'registration no'] },
        { key: 'nameBn', label: 'Name in Bengali', aliases: ['bengali name', 'নাম'] },
        { key: 'dob', label: 'Date of birth', aliases: ['dob', 'birth date', 'date of birth (dd-mm-yyyy)'] },
        { key: 'gender', label: 'Gender', aliases: ['sex'] },
        { key: 'fatherName', label: "Father's name", aliases: ['father', 'father name'] },
        { key: 'motherName', label: "Mother's name", aliases: ['mother', 'mother name'] },
        { key: 'guardianName', label: 'Guardian', aliases: ['guardian name'] },
        { key: 'phone', label: 'Guardian mobile', aliases: ['mobile', 'phone', 'mobile no', 'contact', 'contact no', 'whatsapp'] },
        { key: 'altPhone', label: 'Other mobile', aliases: ['alternate mobile', 'mobile 2', 'phone 2'] },
        { key: 'address', label: 'Address', aliases: ['home address', 'village', 'full address'] },
        { key: 'category', label: 'Category', aliases: ['caste', 'social category'] },
        { key: 'religion', label: 'Religion' },
        { key: 'bloodGroup', label: 'Blood group', aliases: ['blood'] },
        { key: 'portalId', label: 'Banglar Shiksha ID', aliases: ['student id', 'portal id', 'banglar shiksha', 'bsid'] },
        { key: 'admittedOn', label: 'Admission date', aliases: ['date of admission', 'admitted on', 'doa'] },
      ]}
    />
  );
}
