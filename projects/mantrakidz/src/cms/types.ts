/**
 * The shape of editable website content.
 *
 * The website is cut into SECTIONS ("Home › Hero", "Contact details"). Each
 * section declares its fields once, with default text. From that one
 * declaration come three things:
 *   1. the page reads typed content        →  const hero = await content(homeHero)
 *   2. the edit panel builds its form       →  no per-section form code
 *   3. the voice assistant knows what can be changed and what it is called
 *
 * Add a field here and it is editable everywhere, by hand and by voice.
 */

export type ScalarFieldType =
  | 'text' // one line
  | 'textarea' // a paragraph
  | 'image' // a photo: stored as a URL, picked from the media library
  | 'url'
  | 'phone'
  | 'email'
  | 'toggle' // '1' or ''
  | 'select'; // one of `options`

export type ScalarField = {
  name: string;
  label: string;
  type: ScalarFieldType;
  help?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
  /** Other things an editor might call this field when speaking. */
  aliases?: string[];
};

/** A repeating group: testimonials, FAQs, facilities. */
export type ListField = {
  name: string;
  label: string;
  type: 'list';
  /** What one row is called: "testimonial", "question". */
  itemLabel: string;
  fields: ScalarField[];
  /** The field shown as the row's title in the panel. */
  titleField?: string;
  max?: number;
  help?: string;
  aliases?: string[];
};

export type Field = ScalarField | ListField;

export type ContentValue = string | Record<string, string>[];
export type ContentData = Record<string, ContentValue>;

export type SectionDef<T extends ContentData = ContentData> = {
  /** Stable id and database key: 'home.hero'. Never rename once live. */
  key: string;
  /** Group shown in the panel: 'Home', 'About', 'Whole site'. */
  page: string;
  label: string;
  description?: string;
  /** Public path where this section appears, for the "see it" link. */
  path?: string;
  fields: Field[];
  defaults: T;
  /** Other names an editor might say for this section. */
  aliases?: string[];
  /**
   * Default wording in Bengali and Hindi. Only text needs to be here: photos,
   * links and phone numbers fall through from English. A list given here
   * replaces the English list whole, so repeat any photo fields in its rows.
   */
  translations?: { bn?: Partial<T>; hi?: Partial<T> };
};

export function defineSection<T extends ContentData>(def: SectionDef<T>): SectionDef<T> {
  return def;
}

export const isListField = (field: Field): field is ListField => field.type === 'list';
