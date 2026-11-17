/**
 * Bengali wording for every section, keyed by section key. Written the way
 * people in Kolkata speak, not word for word from the English.
 *
 * Rules kept throughout: the business name is not translated; digits stay
 * Latin; nothing is claimed here that the English does not claim. Only text
 * is translated: photos, links and phone numbers fall through from English.
 * A list given here replaces the English list whole, so its rows repeat the
 * photo, icon and colour fields.
 */
import type { ContentData } from '../../types';

export const BN: Record<string, ContentData> = {
  'site.brand': {
    tagline: 'আপনার ট্যাগলাইন এখানে',
  },
  'site.contact': {},
  'site.header': {
    enquireLabel: 'খোঁজ নিন',
    loginLabel: 'লগইন',
  },
  'site.footer': {
    about: 'ব্যবসা সম্পর্কে ছোট একটি লাইন এখানে বসবে। এডিট প্যানেল থেকে বদলে নিন।',
    note: 'সর্বস্বত্ব সংরক্ষিত।',
  },
  'site.cta': {
    heading: 'কিছু জানার আছে? আমাদের বলুন',
    text: 'ফোন করুন, হোয়াটসঅ্যাপে মেসেজ পাঠান বা লিখে জানান। প্রতিটি খোঁজের উত্তর আমরা দিই।',
    primaryLabel: 'যোগাযোগ করুন',
    whatsappLabel: 'হোয়াটসঅ্যাপে কথা বলুন',
    whatsappMessage: 'নমস্কার, আমি আরও জানতে চাই।',
  },

  'home.hero': {
    eyebrow: 'স্বাগত',
    heading: 'আপনার মূল শিরোনাম এখানে বসবে',
    highlight: 'মূল শিরোনাম',
    text: 'ব্যবসাটি কী করে এবং কাদের জন্য, এক-দুই লাইনে লিখুন। এডিট প্যানেল থেকে বদলে নিন।',
    imageAlt: 'নমুনা ব্যানার ছবি',
    primaryLabel: 'খোঁজ নিন',
    secondaryLabel: 'আমাদের কথা',
    slides: [
      {
        type: 'image',
        image: '/images/hero.jpg',
        video: '',
        heading: 'আপনার মূল শিরোনাম এখানে বসবে',
        text: 'ব্যবসাটি কী করে এবং কাদের জন্য, এক-দুই লাইনে লিখুন। এডিট প্যানেল থেকে বদলে নিন।',
        buttonLabel: 'খোঁজ নিন',
        buttonLink: '/contact#enquire',
        alt: 'নমুনা ব্যানার ছবি',
      },
      {
        type: 'image',
        image: '/images/sample-4.webp',
        video: '',
        heading: 'অফার বা খবরের জন্য দ্বিতীয় স্লাইড',
        text: 'প্রতিটি স্লাইডের নিজস্ব ছবি, শিরোনাম ও বোতাম থাকে। এডিট প্যানেল থেকে স্লাইড যোগ করুন, বদলান বা সরান।',
        buttonLabel: 'গ্যালারি দেখুন',
        buttonLink: '/gallery',
        alt: 'নমুনা ছবি',
      },
    ],
  },
  'home.marquee': {
    items: [{ text: 'পরিষেবা এক' }, { text: 'পরিষেবা দুই' }, { text: 'পরিষেবা তিন' }, { text: 'পরিষেবা চার' }, { text: 'পরিষেবা পাঁচ' }, { text: 'পরিষেবা ছয়' }],
  },
  'home.intro': {
    eyebrow: 'স্বাগত',
    heading: 'ব্যবসার একটি ছোট পরিচয়',
    highlight: 'ছোট পরিচয়',
    text: 'এখানে তিন-চার লাইন লিখুন: ব্যবসাটি কী করে, কোথায় এবং কেন আলাদা। সহজ ও সত্যি কথায় লিখুন।',
    imageAlt: 'নমুনা ছবি',
    image2Alt: 'নমুনা ছবি',
    points: [{ text: 'ব্যবসা সম্পর্কে প্রথম কথা' }, { text: 'ব্যবসা সম্পর্কে দ্বিতীয় কথা' }, { text: 'ব্যবসা সম্পর্কে তৃতীয় কথা' }],
    buttonLabel: 'আমাদের সম্পর্কে আরও',
  },
  'home.why': {
    eyebrow: 'কেন আমরা',
    heading: 'আমাদের কাছে যা আশা করতে পারেন',
    highlight: 'আশা করতে পারেন',
    text: 'তিন-চারটি ছোট কথা, যা ব্যবসা সত্যিই রাখতে পারে।',
    items: [
      { title: 'প্রথম গুণ', text: 'এ নিয়ে এক-দুই লাইন।', icon: 'star', color: 'sun' },
      { title: 'দ্বিতীয় গুণ', text: 'এ নিয়ে এক-দুই লাইন।', icon: 'heart', color: 'coral' },
      { title: 'তৃতীয় গুণ', text: 'এ নিয়ে এক-দুই লাইন।', icon: 'shield', color: 'mint' },
    ],
  },
  'home.gallery': {
    eyebrow: 'গ্যালারি',
    heading: 'আমাদের কাজের কিছু ছবি',
    highlight: 'কাজের কিছু ছবি',
    text: 'গ্যালারি থেকে কয়েকটি ছবি।',
    buttonLabel: 'সব ছবি দেখুন',
  },
  'home.testimonials': {
    eyebrow: 'ভালো লাগার কথা',
    heading: 'আমাদের সম্পর্কে মানুষ যা বলেন',
    highlight: 'মানুষ যা বলেন',
  },
  'home.notices': {
    eyebrow: 'নোটিস বোর্ড',
    heading: 'নোটিস ও অনুষ্ঠান',
    buttonLabel: 'সব নোটিস',
  },

  'about.top': {
    eyebrow: 'আমাদের কথা',
    heading: 'আমরা কারা এবং কী করি',
    text: 'ব্যবসার পরিচয় এক লাইনে।',
  },
  'about.story': {
    heading: 'আমাদের গল্প',
    highlight: 'গল্প',
    text: 'ব্যবসা কীভাবে শুরু হল এবং আজ কী করে, এখানে লিখুন।',
    text2: 'দরকার হলে দ্বিতীয় অনুচ্ছেদ। শুধু প্রথমটি দেখাতে চাইলে এটি ফাঁকা রাখুন।',
    imageAlt: 'নমুনা ছবি',
  },
  'about.approach': {
    eyebrow: 'আমরা যেভাবে কাজ করি',
    heading: 'যে কথায় ভরসা রাখতে পারেন',
    highlight: 'ভরসা রাখতে পারেন',
    items: [
      { title: 'প্রথম কথা', text: 'এ নিয়ে কয়েক লাইন।', icon: 'hand', color: 'sun' },
      { title: 'দ্বিতীয় কথা', text: 'এ নিয়ে কয়েক লাইন।', icon: 'chat', color: 'coral' },
      { title: 'তৃতীয় কথা', text: 'এ নিয়ে কয়েক লাইন।', icon: 'clock', color: 'mint' },
    ],
  },
  'about.mission': {
    missionHeading: 'আমাদের লক্ষ্য',
    mission: 'ব্যবসার লক্ষ্য এক-দুই লাইনে লিখুন।',
    visionHeading: 'আমাদের স্বপ্ন',
    vision: 'কয়েক বছর পরে ব্যবসাকে কোথায় দেখতে চান, লিখুন।',
  },
  'about.owner': {
    heading: 'মালিকের কথা',
    message: 'এখানে মালিকের একটি ছোট বার্তা লিখুন: ব্যবসা কেন শুরু হল এবং গ্রাহকেরা কী আশা করতে পারেন। তিন-চারটি বাক্যই যথেষ্ট।',
    name: 'মালিকের নাম',
    role: 'মালিক',
  },

  'gallery.top': {
    eyebrow: 'গ্যালারি',
    heading: 'ছবি',
    text: 'ছবিতে টোকা দিলে বড় করে দেখা যাবে।',
    allLabel: 'সব ছবি',
    emptyText: 'ছবি শিগগিরই আসছে। আবার একবার দেখে যাবেন।',
  },
  'notices.top': {
    eyebrow: 'নোটিস বোর্ড',
    heading: 'নোটিস ও অনুষ্ঠান',
    text: 'খবর, অফার ও অনুষ্ঠান।',
    emptyText: 'এই মুহূর্তে কোনো নোটিস নেই।',
  },
  'contact.top': {
    eyebrow: 'যোগাযোগ',
    heading: 'আমাদের সঙ্গে কথা বলুন',
    text: 'ফোন করুন, হোয়াটসঅ্যাপে মেসেজ পাঠান বা এখানে লিখে জানান।',
  },
  'contact.form': {
    heading: 'আমাদের লিখুন',
    text: 'আমরা প্রতিটি মেসেজ পড়ি এবং ফোনে উত্তর দিই।',
    buttonLabel: 'মেসেজ পাঠান',
    successHeading: 'ধন্যবাদ। আপনার মেসেজ আমরা পেয়েছি।',
    successText: 'আপনার দেওয়া নম্বরে আমরা ফোন করব। জরুরি হলে হোয়াটসঅ্যাপে মেসেজ করুন।',
    mapHeading: 'আমাদের ঠিকানা',
    mapButton: 'গুগল ম্যাপে খুলুন',
  },
};
