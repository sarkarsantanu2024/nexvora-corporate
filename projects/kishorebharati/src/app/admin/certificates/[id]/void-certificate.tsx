'use client';

import { Ban } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, Input } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { voidCertificateAction } from '@/server/certificates/actions';
import { useAction } from '../../_ui/use-action';

/** Voids a wrong certificate with a reason. Its serial number is not used again. */
export function VoidCertificate({ id, serialNo }: { id: string; serialNo: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const save = useAction(voidCertificateAction, { success: t('Certificate voided'), onDone: () => setOpen(false) });
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Ban size={16} /> {t('Void')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={t('Void {serial}?', { serial: serialNo })}
        description={t('It stays in the register, struck out, with the reason. Voiding a transfer certificate does not bring the student back on roll.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton variant="accent" loading={save.busy} disabled={!reason.trim()} onClick={() => save.run(id, reason)}>
              {t('Void')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Reason')} required error={save.fields.reason && t(save.fields.reason)}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Wrong date of birth printed')} />
        </Field>
      </Modal>
    </>
  );
}
