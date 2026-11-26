'use client';

import { MessageSquarePlus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button, Field, Textarea } from '@/components/ui/core';
import { LoadingButton, Modal } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { saveRemarkAction } from '@/server/exams/actions';
import { useAction } from '../../_ui/use-action';

/** The class teacher's remark for one boy in one exam; printed on the report card. */
export function RemarkButton({ examId, studentId, name, remark }: { examId: string; studentId: string; name: string; remark: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(remark);
  const save = useAction(saveRemarkAction, { success: t('Remark saved'), onDone: () => setOpen(false) });
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="no-print w-9 px-0"
        aria-label={remark ? t('Change remark') : t('Add remark')}
        title={remark ? t('Change remark') : t('Add remark')}
        onClick={() => {
          setValue(remark);
          setOpen(true);
        }}
      >
        {remark ? <Pencil size={15} /> : <MessageSquarePlus size={16} />}
      </Button>
      <Modal
        open={open}
        onClose={() => !save.busy && setOpen(false)}
        title={t('Remark for {name}', { name })}
        description={t('Printed on the report card. Keep it short and kind.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => void save.run(examId, studentId, value)}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Remark')} hint={t('{n} letters left', { n: Math.max(0, 300 - value.length) })}>
          <Textarea value={value} maxLength={300} onChange={(e) => setValue(e.target.value)} placeholder={t('Good in Mathematics. Needs to read more Bengali.')} />
        </Field>
      </Modal>
    </>
  );
}
