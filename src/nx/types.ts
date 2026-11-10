// The shapes shared by the annotator output (src/nx/demos/*.json), the
// Edit Panel and the API. A client site built later from a React template
// produces the same shape, so the panel never needs to know which kind of
// site it is editing.

export type Bilingual = { en: string; bn: string };

export type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "link"
  | "phone"
  | "whatsapp"
  | "map"
  | "social"
  | "url";

export type FieldDef = {
  key: string;
  type: FieldType;
  label: Bilingual;
  help?: Bilingual;
  /** text/textarea: the value is inline HTML (bold, italic, line breaks, styled spans). */
  html?: boolean;
  /** image: "16:9", "1:1" or the real pixel ratio such as "1100:1400". */
  aspect?: string;
  /** image: applied as a CSS background rather than an <img>. */
  bg?: boolean;
  /** social: which network the link must belong to. */
  social?: "facebook" | "instagram" | "youtube";
  max?: number;
};

export type ListDef = {
  key: string;
  label: Bilingual;
  min: number;
  max: number;
  fields: FieldDef[];
};

export type SectionDef = {
  id: string;
  label: Bilingual;
  fields: FieldDef[];
  lists: ListDef[];
};

export type ImageValue = { src: string; alt: string };
export type LinkValue = { text: string; href: string };
export type FieldValue = string | ImageValue | LinkValue;
export type ItemValue = Record<string, FieldValue>;
export type ListValue = { items: ItemValue[] };
export type SectionContent = Record<string, FieldValue | ListValue>;
/** The whole content of one site: section id -> values. */
export type SiteContent = Record<string, SectionContent>;

export type SiteSchema = {
  site: string;
  template: string;
  version: number;
  name: string;
  sections: SectionDef[];
  defaults: SiteContent;
};

export type ContentState = "draft" | "published";

export type StorageMode = "neon" | "file" | "browser";

export function isListValue(v: unknown): v is ListValue {
  return !!v && typeof v === "object" && Array.isArray((v as ListValue).items);
}
export function isImageValue(v: unknown): v is ImageValue {
  return !!v && typeof v === "object" && "src" in (v as object);
}
export function isLinkValue(v: unknown): v is LinkValue {
  return !!v && typeof v === "object" && "href" in (v as object) && "text" in (v as object);
}
