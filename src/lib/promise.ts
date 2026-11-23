// The founder's promise, in the languages our customers actually speak.
//
// The English is Santanu's own wording, kept close to how he wrote it — short
// sentences and everyday words, no "quotation", no "scope", no "deliverable".
// Someone who left school early should be able to read it once and know
// exactly what happens.
//
// The translations say the same thing, not a more formal version of it. They
// were written to be spoken aloud, which is how most of this will be read.
// Have a native speaker glance over each before a campaign leans on it.
//
// Three languages, not six. Tamil, Telugu and Punjabi were dropped on
// 2026-08-21: nobody had checked them, they were the ones most likely to read
// as machine translation to a native speaker, and three well-written languages
// say more about the business than six uncertain ones. Bengali and Hindi cover
// where the work actually comes from. Add a language back only when someone
// who speaks it has read the words.
export type PromiseText = {
  code: string;
  label: string; // shown on the switcher, in that language's own script
  aria: string; // English name, for screen readers and the lang attribute
  lang: string; // BCP-47 tag
  text: string;
};

export const PROMISE_TEXTS: PromiseText[] = [
  {
    code: "en",
    label: "English",
    aria: "English",
    lang: "en-IN",
    text: "Websites are my headache, not yours. Before any work, I want us to know and trust each other. Just tell me on WhatsApp what you need.",
  },
  {
    code: "bn",
    label: "বাংলা",
    aria: "Bengali",
    lang: "bn-IN",
    text: "ওয়েবসাইটের ঝামেলা আমার, আপনার নয়। কাজের আগে চাই, আমাদের মধ্যে একটা ভরসার সম্পর্ক তৈরি হোক। কী দরকার, শুধু WhatsApp-এ বলে দিন।",
  },
  {
    code: "hi",
    label: "हिन्दी",
    aria: "Hindi",
    lang: "hi-IN",
    text: "वेबसाइट की झंझट मेरी है, आपकी नहीं। काम से पहले मैं चाहता हूँ कि हमारे बीच भरोसे का रिश्ता बने। क्या चाहिए, बस WhatsApp पर बता दीजिए।",
  },
];
