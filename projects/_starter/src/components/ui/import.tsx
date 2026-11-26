'use client';

/**
 * Bring a list in from a spreadsheet: choose a CSV file or paste cells copied
 * from Excel, match the sheet's columns to our fields (guessed from the
 * headings), look at the first rows, then import. Rows the server refuses are
 * listed with the reason, by their row number in the sheet.
 *
 *   <ImportButton
 *     title="Import enquiries"
 *     fields={[{ key: 'name', label: 'Name', required: true, aliases: ['full name'] }, …]}
 *     onImport={importEnquiriesAction}
 *   />
 *
 * The server action takes the rows as plain objects keyed by field and
 * returns { added, skipped: [{ row, error }] }. Each row is checked there.
 */
import { FileUp, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { ActionResult } from '@/lib/api';
import { headingKey, parseCsv } from '@/lib/csv';
import { LoadingButton, Modal, useToast } from './client';
import { Button, Field, Notice, Select, Textarea } from './core';
import { useT } from './lang';

export type ImportField = { key: string; label: string; required?: boolean; aliases?: string[]; hint?: string };
export type ImportResult = { added: number; skipped: { row: number; error: string }[] };
export type ImportRow = Record<string, string>;

/** One import at a time stays well inside what a server action may receive. */
export const IMPORT_MAX_ROWS = 2000;

function guessColumns(fields: ImportField[], headings: string[]): Record<string, number> {
  const keys = headings.map(headingKey);
  const used = new Set<number>();
  const map: Record<string, number> = {};
  for (const field of fields) {
    const names = [field.key, field.label, ...(field.aliases ?? [])].map(headingKey);
    const index = keys.findIndex((key, i) => !used.has(i) && names.includes(key));
    if (index >= 0) {
      map[field.key] = index;
      used.add(index);
    }
  }
  return map;
}

export function ImportButton({
  title,
  description,
  fields,
  onImport,
  label,
}: {
  title: string;
  description?: string;
  fields: ImportField[];
  onImport: (rows: ImportRow[]) => Promise<ActionResult<ImportResult>>;
  label?: string;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [columns, setColumns] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const table = useMemo(() => parseCsv(text), [text]);
  const headings = table[0] ?? [];
  const body = table.slice(1);
  const missing = fields.filter((field) => field.required && columns[field.key] === undefined);

  const load = (value: string) => {
    setText(value);
    setResult(null);
    setColumns(guessColumns(fields, parseCsv(value)[0] ?? []));
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      toast.error(t('Choose a CSV file. In Excel: File, Save as, CSV.'));
      return;
    }
    load(await file.text());
  };

  const rows = (): ImportRow[] =>
    body.map((cells) => Object.fromEntries(fields.map((field) => [field.key, columns[field.key] === undefined ? '' : (cells[columns[field.key]] ?? '')])));

  const run = async () => {
    if (body.length > IMPORT_MAX_ROWS) {
      toast.error(t('At most {n} rows at a time. Split the sheet and import it in parts.', { n: IMPORT_MAX_ROWS }));
      return;
    }
    setBusy(true);
    try {
      const outcome = await onImport(rows());
      if (!outcome.ok) {
        toast.error(t(outcome.error));
        return;
      }
      setResult(outcome.data);
      toast.success(t('{n} added', { n: outcome.data.added }));
      router.refresh();
    } catch {
      toast.error(t('Could not reach the server. Check the connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    setText('');
    setResult(null);
    setColumns({});
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload size={16} /> {label ?? t('Import')}
      </Button>
      <Modal
        open={open}
        onClose={close}
        size="xl"
        title={title}
        description={description ?? t('From a spreadsheet: choose a CSV file, or copy the cells in Excel and paste them here. Keep the headings row.')}
        footer={
          result ? (
            <Button onClick={close}>{t('Done')}</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                {t('Cancel')}
              </Button>
              <LoadingButton loading={busy} disabled={!body.length || missing.length > 0} onClick={run}>
                {t('Import {n} rows', { n: body.length })}
              </LoadingButton>
            </>
          )
        }
      >
        {result ? (
          <div className="space-y-3">
            <Notice tone={result.skipped.length ? 'amber' : 'green'}>
              {t('{added} added, {skipped} left out.', { added: result.added, skipped: result.skipped.length })}
            </Notice>
            {result.skipped.length ? (
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                {result.skipped.map((item) => (
                  <li key={item.row} className="rounded-lg bg-ink-50 px-3 py-2">
                    <span className="tabular font-semibold">{t('Row {n}', { n: item.row })}</span>: {t(item.error)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,text/csv" className="hidden" onChange={(e) => void readFile(e.target.files?.[0])} />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <FileUp size={16} /> {t('Choose CSV file')}
              </Button>
              <span className="text-sm text-ink-500">{t('or paste below')}</span>
            </div>
            <Textarea rows={4} value={text} onChange={(e) => load(e.target.value)} placeholder={fields.map((field) => t(field.label)).join('\t')} aria-label={t('Pasted cells')} className="font-mono text-xs" />

            {headings.length ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <Field key={field.key} label={t(field.label)} required={field.required} hint={field.hint ? t(field.hint) : undefined}>
                      <Select
                        value={columns[field.key] === undefined ? '' : String(columns[field.key])}
                        onChange={(e) => setColumns((map) => {
                          const next = { ...map };
                          if (e.target.value === '') delete next[field.key];
                          else next[field.key] = Number(e.target.value);
                          return next;
                        })}
                      >
                        <option value="">{t('Not in the sheet')}</option>
                        {headings.map((heading, index) => (
                          <option key={index} value={index}>
                            {heading || t('Column {n}', { n: index + 1 })}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ))}
                </div>
                {missing.length ? <Notice tone="amber">{t('Choose the column for: {list}', { list: missing.map((field) => t(field.label)).join(', ') })}</Notice> : null}
                <div className="overflow-x-auto rounded-xl border border-ink-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-ink-50 text-xs text-ink-500">
                      <tr>
                        {fields.map((field) => (
                          <th key={field.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                            {t(field.label)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows()
                        .slice(0, 5)
                        .map((row, index) => (
                          <tr key={index} className="border-t border-ink-100">
                            {fields.map((field) => (
                              <td key={field.key} className="whitespace-nowrap px-3 py-2 text-ink-700">
                                {row[field.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-ink-500">{t('The first {n} of {total} rows.', { n: Math.min(5, body.length), total: body.length })}</p>
              </>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}
