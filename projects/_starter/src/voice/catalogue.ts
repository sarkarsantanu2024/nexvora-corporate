/**
 * The list of everything on the website that can be changed, in a plain
 * shape the browser, the grammar and Claude can all read. Built from the
 * section registry, so a new section is voice-editable the day it is added.
 */
import type { Field, ScalarFieldType, SectionDef } from '@/cms/types';

export type CatField = {
  name: string;
  label: string;
  type: ScalarFieldType | 'list';
  aliases: string[];
  maxLength?: number;
  options?: { value: string; label: string }[];
  /** Lists only. */
  itemLabel?: string;
  titleField?: string;
  max?: number;
  fields?: CatField[];
};

export type CatSection = {
  key: string;
  page: string;
  label: string;
  path?: string;
  aliases: string[];
  fields: CatField[];
};

export type Catalogue = CatSection[];

function toField(field: Field): CatField {
  if (field.type === 'list') {
    return {
      name: field.name,
      label: field.label,
      type: 'list',
      aliases: field.aliases ?? [],
      itemLabel: field.itemLabel,
      titleField: field.titleField,
      max: field.max,
      fields: field.fields.map(toField),
    };
  }
  return { name: field.name, label: field.label, type: field.type, aliases: field.aliases ?? [], maxLength: field.maxLength, options: field.options };
}

export function buildCatalogue(sections: SectionDef[]): Catalogue {
  return sections.map((section) => ({
    key: section.key,
    page: section.page,
    label: section.label,
    path: section.path,
    aliases: section.aliases ?? [],
    fields: (section.fields as Field[]).map(toField),
  }));
}

export const findSection = (catalogue: Catalogue, key: string) => catalogue.find((section) => section.key === key) ?? null;
export const findField = (catalogue: Catalogue, key: string, name: string) => findSection(catalogue, key)?.fields.find((field) => field.name === name) ?? null;

/** "Top banner › Heading", for cards and questions. */
export function targetLabel(catalogue: Catalogue, key: string, name?: string): string {
  const section = findSection(catalogue, key);
  if (!section) return key;
  const field = name ? section.fields.find((item) => item.name === name) : null;
  const where = `${section.page} › ${section.label}`;
  return field ? `${field.label} (${where})` : where;
}
