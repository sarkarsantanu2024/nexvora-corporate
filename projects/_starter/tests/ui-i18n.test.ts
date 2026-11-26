/**
 * Guards the Hindi and Bengali wording of the dashboards (src/i18n).
 *
 * The English sentence is the key, so the easy mistakes are: a sentence added
 * to one language and not the other, a value left empty, a {name} dropped from
 * a translation (the number or name would vanish from the screen), and a
 * screen using a sentence that neither file has yet.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI_BN } from '@/i18n/ui-bn';
import { UI_HI } from '@/i18n/ui-hi';

const SRC = path.resolve(__dirname, '../src');
// A business module adds its own folders here (say 'app/shop'), so its screens are checked too.
const SCANNED = ['app/admin', 'app/account', 'app/login', 'app/suspended', 'components/ui', 'components/cms', 'components/pwa', 'components/dash', 'server'];
const DICTS: [string, Record<string, string>][] = [
  ['Hindi', UI_HI],
  ['Bengali', UI_BN],
];

const placeholders = (text: string) => text.match(/\{\w+\}/g) ?? [];

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Every t('...') and t("...") written on one line, with the file it is in. */
function keysInCode(): { key: string; file: string }[] {
  const call = /\bt\(\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
  const found: { key: string; file: string }[] = [];
  for (const dir of SCANNED) {
    for (const file of filesUnder(path.join(SRC, dir))) {
      for (const match of readFileSync(file, 'utf8').matchAll(call)) {
        found.push({ key: (match[1] ?? match[2]).replace(/\\(.)/g, '$1'), file: path.relative(SRC, file).replace(/\\/g, '/') });
      }
    }
  }
  return found;
}

describe('dashboard wording in Hindi and Bengali', () => {
  it('has the same sentences in both languages', () => {
    const hi = Object.keys(UI_HI);
    const bn = new Set(Object.keys(UI_BN));
    const hiSet = new Set(hi);
    expect(hi.filter((key) => !bn.has(key)), 'in Hindi but not in Bengali').toEqual([]);
    expect([...bn].filter((key) => !hiSet.has(key)), 'in Bengali but not in Hindi').toEqual([]);
  });

  it('leaves no translation empty', () => {
    for (const [name, dict] of DICTS) {
      const empty = Object.entries(dict).filter(([, value]) => !value.trim()).map(([key]) => key);
      expect(empty, `empty in ${name}`).toEqual([]);
    }
  });

  it('keeps every {name} of the English sentence in the translation', () => {
    for (const [name, dict] of DICTS) {
      const dropped = Object.entries(dict)
        .filter(([key, value]) => placeholders(key).some((mark) => !value.includes(mark)))
        .map(([key]) => key);
      expect(dropped, `a {name} is missing in ${name}`).toEqual([]);
    }
  });

  it('has a translation for every sentence the screens use', () => {
    const used = keysInCode();
    expect(used.length).toBeGreaterThan(300);
    for (const [name, dict] of DICTS) {
      const missing = [...new Set(used.filter(({ key }) => !(key in dict)).map(({ key, file }) => `${file}: ${key}`))];
      expect(missing, `used on a screen but not in ${name}`).toEqual([]);
    }
  });
});
