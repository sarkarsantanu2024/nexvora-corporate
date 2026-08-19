// The founder's promise, in the languages our customers actually speak.
//
// The English was deliberately rewritten down to short sentences and everyday
// words — no "quotation", no "scope", no "deliverable". Someone who left school
// early should be able to read it once and know exactly what happens.
//
// The translations say the same thing, not a more formal version of it. They
// were written to be spoken aloud, which is how most of this will be read.
// Have a native speaker glance over each before a campaign leans on it.
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
    text: "Tell me on WhatsApp what you need. Pay half to start. Then relax — I will tell you when I begin, when it is ready to see, and when it goes online. I will never tell you a lie. If it will take longer, you will hear it from me the same day.",
  },
  {
    code: "bn",
    label: "বাংলা",
    aria: "Bengali",
    lang: "bn-IN",
    text: "হোয়াটসঅ্যাপে আমাকে বলুন আপনার কী দরকার। শুরু করতে অর্ধেক টাকা দিন। তারপর নিশ্চিন্তে থাকুন — কাজ শুরু করলে, তৈরি হলে আর অনলাইনে এলে আমি নিজে জানাব। আমি কখনও মিথ্যা বলব না। দেরি হলে সেই দিনই আপনাকে বলে দেব।",
  },
  {
    code: "hi",
    label: "हिन्दी",
    aria: "Hindi",
    lang: "hi-IN",
    text: "व्हाट्सएप पर मुझे बताइए कि आपको क्या चाहिए। शुरू करने के लिए आधा पैसा दीजिए। फिर निश्चिंत रहिए — काम शुरू होने पर, तैयार होने पर और ऑनलाइन आने पर मैं खुद बताऊँगा। मैं कभी झूठ नहीं बोलूँगा। देर होगी तो उसी दिन बता दूँगा।",
  },
  {
    code: "ta",
    label: "தமிழ்",
    aria: "Tamil",
    lang: "ta-IN",
    text: "உங்களுக்கு என்ன வேண்டும் என்று வாட்ஸ்அப்பில் சொல்லுங்கள். தொடங்குவதற்கு பாதி பணம் கொடுங்கள். பிறகு நிம்மதியாக இருங்கள் — வேலையைத் தொடங்கும்போது, தயாராகும்போது, இணையத்தில் வரும்போது நானே சொல்வேன். நான் ஒருபோதும் பொய் சொல்ல மாட்டேன். தாமதம் ஆனால் அன்றைக்கே உங்களிடம் சொல்லிவிடுவேன்.",
  },
  {
    code: "te",
    label: "తెలుగు",
    aria: "Telugu",
    lang: "te-IN",
    text: "మీకు ఏమి కావాలో వాట్సాప్‌లో చెప్పండి. మొదలుపెట్టడానికి సగం డబ్బు ఇవ్వండి. తరువాత నిశ్చింతగా ఉండండి — పని మొదలైనప్పుడు, సిద్ధమైనప్పుడు, ఆన్‌లైన్‌లోకి వచ్చినప్పుడు నేనే చెబుతాను. నేను ఎప్పుడూ అబద్ధం చెప్పను. ఆలస్యం అయితే ఆ రోజే మీకు చెప్పేస్తాను.",
  },
  {
    code: "pa",
    label: "ਪੰਜਾਬੀ",
    aria: "Punjabi",
    lang: "pa-IN",
    text: "ਵਟਸਐਪ ਉੱਤੇ ਮੈਨੂੰ ਦੱਸੋ ਕਿ ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ। ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਅੱਧੇ ਪੈਸੇ ਦਿਓ। ਫਿਰ ਬੇਫ਼ਿਕਰ ਰਹੋ — ਕੰਮ ਸ਼ੁਰੂ ਹੋਣ ਵੇਲੇ, ਤਿਆਰ ਹੋਣ ਵੇਲੇ ਅਤੇ ਆਨਲਾਈਨ ਆਉਣ ਵੇਲੇ ਮੈਂ ਆਪ ਦੱਸਾਂਗਾ। ਮੈਂ ਕਦੇ ਝੂਠ ਨਹੀਂ ਬੋਲਾਂਗਾ। ਦੇਰ ਹੋਈ ਤਾਂ ਉਸੇ ਦਿਨ ਦੱਸ ਦਿਆਂਗਾ।",
  },
];
