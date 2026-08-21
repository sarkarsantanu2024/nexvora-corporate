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
    text: "You don't need to know anything about websites. You can simply tell me on WhatsApp what you need — a message, a voice note, a few photos, or even a rough idea is enough to start with. I will explain what can be done, what it will cost, and what is included, in simple language. No confusing quotation, and no surprise price in the middle.",
  },
  {
    code: "bn",
    label: "বাংলা",
    aria: "Bengali",
    lang: "bn-IN",
    text: "ওয়েবসাইটের ব্যাপারে আপনার কিছু জানার দরকার নেই। আপনার কী দরকার, WhatsApp-এ আমাকে বলে দিলেই হবে — একটা মেসেজ, ভয়েস নোট, কয়েকটা ছবি, এমনকি একটা মোটামুটি ধারণা হলেই শুরু করা যায়। কী কী করা সম্ভব, কত খরচ হবে আর তার মধ্যে কী কী থাকছে, সহজ ভাষায় বুঝিয়ে দেব। জটিল কোটেশন নেই, মাঝপথে হঠাৎ দাম বাড়ার ব্যাপারও নেই।",
  },
  {
    code: "hi",
    label: "हिन्दी",
    aria: "Hindi",
    lang: "hi-IN",
    text: "वेबसाइट के बारे में आपको कुछ जानने की ज़रूरत नहीं है। आपको क्या चाहिए, WhatsApp पर मुझे बता दीजिए, बस इतना ही काफी है — एक मैसेज, वॉइस नोट, कुछ तस्वीरें, या बस एक मोटा-मोटा खयाल भी चलेगा। क्या-क्या हो सकता है, कितना खर्च आएगा और उसमें क्या-क्या शामिल है, सब आसान भाषा में समझा दूँगा। उलझाने वाला कोटेशन नहीं, बीच में अचानक दाम बढ़ने वाली बात नहीं।",
  },
];
