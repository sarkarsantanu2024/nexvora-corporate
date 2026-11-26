/**
 * What Claude sends back is checked like anything else from outside:
 * it may only name sections and fields that exist, and it must fit the
 * Intent schema. (The network call itself is not made here.)
 */
import { describe, expect, it } from 'vitest';
import { defineSection, type SectionDef } from '@/cms/types';
import { buildCatalogue } from '@/voice/catalogue';
import { allowInterpret, compactCatalogue, intentFromModel, type ModelAnswer } from '@/voice/interpret';

const contact = defineSection({
  key: 'site.contact',
  page: 'Whole site',
  label: 'Contact details',
  fields: [
    { name: 'phone', label: 'Phone number', type: 'phone' },
    { name: 'hours', label: 'Office hours', type: 'text' },
    { name: 'logo', label: 'Logo', type: 'image' },
    { name: 'open', label: 'Show the badge', type: 'toggle' },
  ],
  defaults: { phone: '8777896483', hours: 'SECRET CURRENT VALUE', logo: '', open: '' },
});
const faq = defineSection({
  key: 'offers.faq',
  page: 'Offers',
  label: 'Common questions',
  fields: [
    {
      name: 'items',
      label: 'Questions',
      type: 'list',
      itemLabel: 'question',
      fields: [
        { name: 'question', label: 'Question', type: 'text' },
        { name: 'answer', label: 'Answer', type: 'textarea' },
      ],
    },
  ],
  defaults: { items: [] as Record<string, string>[] },
});
const catalogue = buildCatalogue([contact, faq] as SectionDef[]);

const answer = (over: Partial<ModelAnswer>): ModelAnswer => ({ action: 'none', section: '', field: '', value: '', item: [], album: '', title: '', body: '', place: '', ...over });

describe('answers from Claude', () => {
  it('accepts a field change and cleans the value for its type', () => {
    expect(intentFromModel(answer({ action: 'set_field', section: 'site.contact', field: 'phone', value: '+91 98300 12345' }), catalogue)).toMatchObject({
      kind: 'setField',
      section: 'site.contact',
      field: 'phone',
      value: '9830012345',
    });
  });

  it('rejects sections and fields that do not exist', () => {
    expect(intentFromModel(answer({ action: 'set_field', section: 'site.settings', field: 'phone', value: '1' }), catalogue)).toBeNull();
    expect(intentFromModel(answer({ action: 'set_field', section: 'site.contact', field: 'password', value: '1' }), catalogue)).toBeNull();
    expect(intentFromModel(answer({ action: 'hide_section', section: '../../etc' }), catalogue)).toBeNull();
    expect(intentFromModel(answer({ action: 'set_field', section: 'offers.faq', field: 'items', value: 'x' }), catalogue)).toBeNull();
  });

  it('rejects anything that is not the agreed shape', () => {
    expect(intentFromModel({ action: 'delete_everything' }, catalogue)).toBeNull();
    expect(intentFromModel('set_field', catalogue)).toBeNull();
    expect(intentFromModel(null, catalogue)).toBeNull();
    expect(intentFromModel({ ...answer({ action: 'set_field', section: 'site.contact', field: 'hours' }), value: 42 }, catalogue)).toBeNull();
  });

  it('turns a photo "change" into choosing a photo, never a spoken address', () => {
    expect(intentFromModel(answer({ action: 'set_field', section: 'site.contact', field: 'logo', value: 'https://evil.example/x.png' }), catalogue)).toMatchObject({ kind: 'pickImage', field: 'logo' });
  });

  it('builds a list row from known row fields only', () => {
    const intent = intentFromModel(
      answer({
        action: 'add_list_item',
        section: 'offers.faq',
        field: 'items',
        item: [
          { field: 'question', value: 'do you have a van' },
          { field: 'hack', value: 'x' },
        ],
      }),
      catalogue,
    );
    expect(intent).toMatchObject({ kind: 'appendListItem', item: { question: 'Do you have a van' }, needsEditor: true });
  });

  it('handles toggles, notices, places and "none"', () => {
    expect(intentFromModel(answer({ action: 'set_field', section: 'site.contact', field: 'open', value: '1' }), catalogue)).toMatchObject({ kind: 'setField', value: '1' });
    expect(intentFromModel(answer({ action: 'add_notice', title: 'Shop closed on Friday' }), catalogue)).toMatchObject({ kind: 'addNotice', title: 'Shop closed on Friday' });
    expect(intentFromModel(answer({ action: 'add_notice' }), catalogue)).toBeNull();
    expect(intentFromModel(answer({ action: 'open', place: 'gallery' }), catalogue)).toMatchObject({ kind: 'navigate', to: '/admin/website/gallery' });
    expect(intentFromModel(answer({ action: 'open', section: 'offers.faq' }), catalogue)).toMatchObject({ kind: 'navigate', to: '/admin/website/offers.faq' });
    expect(intentFromModel(answer({ action: 'none' }), catalogue)).toBeNull();
  });
});

describe('what is sent', () => {
  it('sends names and kinds, never the content', () => {
    const sent = compactCatalogue(catalogue);
    expect(sent).toContain('"key":"site.contact"');
    expect(sent).toContain('"rowFields"');
    expect(sent).not.toContain('SECRET CURRENT VALUE');
    expect(sent).not.toContain('8777896483');
  });
});

describe('per-person limit', () => {
  it('allows 30 in five minutes, then waits for the window to pass', () => {
    const start = 1_000_000;
    for (let i = 0; i < 30; i += 1) expect(allowInterpret('u1', start + i)).toBe(true);
    expect(allowInterpret('u1', start + 31)).toBe(false);
    expect(allowInterpret('u2', start + 31)).toBe(true);
    expect(allowInterpret('u1', start + 5 * 60_000 + 40)).toBe(true);
  });
});
