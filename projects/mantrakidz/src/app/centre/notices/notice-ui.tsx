'use client';

import { MessageCircle, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Textarea, buttonClass } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { deleteNoticeAction, pinNoticeAction, saveNoticeAction } from '@/server/centre/money/actions';

export type NoticeRow = { id: string; title: string; body: string; pinned: boolean; eventDate: string; publishOn: string; expiresOn: string };

function NoticeDrawer({ open, onClose, notice, today }: { open: boolean; onClose: () => void; notice?: NoticeRow; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<NoticeRow>(notice ?? { id: '', title: '', body: '', pinned: false, eventDate: '', publishOn: today, expiresOn: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await saveNoticeAction(form);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      return;
    }
    toast.success(notice ? t('Notice changed') : t('Notice added'));
    if (!notice) setForm({ id: '', title: '', body: '', pinned: false, eventDate: '', publishOn: today, expiresOn: '' });
    setErrors({});
    onClose();
    router.refresh();
  }

  return (
    <Drawer
      open={open}
      onClose={() => !saving && onClose()}
      title={notice ? t('Change notice') : t('New notice to parents')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('Cancel')}
          </Button>
          <LoadingButton loading={saving} onClick={save}>
            {t('Save')}
          </LoadingButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('Title')} required error={errors.title && t(errors.title)}>
          <Input value={form.title} invalid={!!errors.title} maxLength={140} placeholder={t('School closed on Friday')} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label={t('Message')} error={errors.body && t(errors.body)}>
          <Textarea rows={6} value={form.body} invalid={!!errors.body} maxLength={3000} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <FormGrid>
          <Field label={t('Show from')} required error={errors.publishOn && t(errors.publishOn)}>
            <Input type="date" value={form.publishOn} invalid={!!errors.publishOn} onChange={(e) => setForm({ ...form, publishOn: e.target.value })} />
          </Field>
          <Field label={t('Show till')} error={errors.expiresOn && t(errors.expiresOn)} hint={t('Leave empty to keep showing')}>
            <Input type="date" value={form.expiresOn} min={form.publishOn} invalid={!!errors.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} />
          </Field>
          <Field label={t('Date of the event')} error={errors.eventDate && t(errors.eventDate)} hint={t('Only for an event')}>
            <Input type="date" value={form.eventDate} invalid={!!errors.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          </Field>
        </FormGrid>
        <label className="flex items-center gap-3 text-[15px] font-medium text-ink-800">
          <input type="checkbox" className="h-5 w-5 rounded accent-brand-700" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
          {t('Pin to the top')}
        </label>
      </div>
    </Drawer>
  );
}

export function AddNoticeButton({ today }: { today: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> {t('New notice')}
      </Button>
      <NoticeDrawer open={open} onClose={() => setOpen(false)} today={today} />
    </>
  );
}

export function NoticeActions({ notice, shareText, today }: { notice: NoticeRow; shareText: string; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function togglePin() {
    setBusy(true);
    const result = await pinNoticeAction(notice.id, !notice.pinned);
    setBusy(false);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* No number: WhatsApp asks which chat or parents' group to send it to. */}
      <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
        <MessageCircle size={15} className="text-mint-500" /> {t('Share')}
      </a>
      <Button variant="secondary" size="sm" disabled={busy} onClick={togglePin} aria-label={notice.pinned ? t('Unpin') : t('Pin to the top')} title={notice.pinned ? t('Unpin') : t('Pin to the top')}>
        {notice.pinned ? <PinOff size={15} /> : <Pin size={15} />}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label={t('Change')}>
        <Pencil size={15} />
      </Button>
      <ConfirmButton
        size="sm"
        aria-label={t('Delete')}
        title={t('Delete this notice?')}
        text={t('"{title}" will no longer show to parents.', { title: notice.title })}
        confirmLabel={t('Delete')}
        onConfirm={async () => {
          const result = await deleteNoticeAction(notice.id);
          if (!result.ok) {
            toast.error(t(result.error));
            return;
          }
          toast.success(t('Notice deleted'));
          router.refresh();
        }}
      >
        <Trash2 size={15} />
      </ConfirmButton>
      {open ? <NoticeDrawer open onClose={() => setOpen(false)} notice={notice} today={today} /> : null}
    </div>
  );
}
