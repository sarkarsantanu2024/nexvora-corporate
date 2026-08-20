// Brand marks are drawn inline rather than pulled from an icon package:
// lucide dropped its social glyphs, and Material Symbols has never carried
// company logos. Paths are the official single-colour marks.
type Social = {
  label: string;
  href: string;
  path: string;
};

const SOCIALS: Social[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/sarkarsantanu69",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/santanusarkar86/",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919804243159",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
  },
  {
    label: "Email",
    href: "mailto:sarkarsantanu69@gmail.com",
    path: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.909 1.528-1.146C21.69 2.28 24 3.434 24 5.457Z",
  },
];

type Tone = "light" | "dark" | "footer";

const TONES: Record<Tone, { wrap: string; icon: string }> = {
  // On white sections: outlined circles that fill with brand on hover.
  light: {
    wrap: "h-10 w-10 border border-slate-300 bg-white text-slate-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white",
    icon: "h-[18px] w-[18px]",
  },
  // On the narrow navy bar at the very top. These used to be dim grey marks on
  // a purple gradient, which read as disabled rather than clickable — so they
  // now sit in their own tinted chips at full white, which is legible against
  // every stop of the gradient behind them.
  dark: {
    wrap: "h-8 w-8 bg-white/15 text-white ring-1 ring-inset ring-white/25 hover:bg-white hover:text-brand-700",
    icon: "h-[17px] w-[17px]",
  },
  // On the dark footer: full-size targets like the light tone, but outlined in
  // white rather than slate so they read against near-black.
  footer: {
    wrap: "h-10 w-10 border border-white/20 bg-white/5 text-slate-300 hover:border-brand-400 hover:bg-brand-500 hover:text-white",
    icon: "h-[18px] w-[18px]",
  },
};

export function SocialLinks({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 sm:gap-2.5 ${className}`}>
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            className={`grid place-items-center rounded-full transition ${t.wrap}`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={t.icon}
              fill="currentColor"
            >
              <path d={s.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
