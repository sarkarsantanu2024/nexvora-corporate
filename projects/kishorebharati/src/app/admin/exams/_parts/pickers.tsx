'use client';

import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Field, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';

type Picker = { param: string; label: string; value: string; options: { value: string; label: string }[] };

/**
 * A row of dropdowns that are the screen's main choice (exam, class, boy),
 * always in view, also on a phone. Changing one clears the ones after it.
 */
export function UrlPickers({ path, pickers }: { path: string; pickers: Picker[] }) {
  const router = useRouter();
  const go = (index: number, value: string) => {
    const params = new URLSearchParams();
    pickers.forEach((picker, i) => {
      const v = i === index ? value : i < index ? picker.value : '';
      if (v) params.set(picker.param, v);
    });
    const query = params.toString();
    router.push(query ? `${path}?${query}` : path, { scroll: false });
  };
  return (
    <div className="no-print mb-4 grid gap-3 sm:grid-cols-3">
      {pickers.map((picker, index) => (
        <Field key={picker.param} label={picker.label}>
          <Select value={picker.value} onChange={(e) => go(index, e.target.value)} disabled={!picker.options.length}>
            {picker.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      ))}
    </div>
  );
}

/** Downloads a table as a CSV file that Excel opens with Bengali intact. */
export function CsvButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  const t = useT();
  const download = () => {
    const cell = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="secondary" onClick={download}>
      <Download size={16} /> {t('CSV')}
    </Button>
  );
}
