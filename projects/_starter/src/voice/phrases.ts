/**
 * What the assistant says back, and the examples it offers, in the three
 * languages. Spoken replies are short on purpose: the screen carries the detail.
 */
import type { VoiceLang } from './intent';

type Replies = {
  ask: (what: string) => string;
  saved: string;
  cancelled: string;
  again: string;
  which: string;
  nothing: string;
  published: string;
  photo: string;
  opening: (where: string) => string;
  undone: string;
  listening: string;
};

export const REPLIES: Record<VoiceLang, Replies> = {
  'en-IN': {
    ask: (what) => `${what}? Say yes to apply.`,
    saved: 'Done. Saved as a draft.',
    cancelled: 'Cancelled.',
    again: 'Sorry, I did not get that.',
    which: 'Which one did you mean?',
    nothing: 'There is nothing to confirm.',
    published: 'Published.',
    photo: 'Choose the photo.',
    opening: (where) => `Opening ${where}.`,
    undone: 'Undone.',
    listening: 'Listening',
  },
  'hi-IN': {
    ask: (what) => `${what}? लागू करने के लिए हाँ बोलिए।`,
    saved: 'हो गया। ड्राफ्ट में सेव है।',
    cancelled: 'रद्द किया।',
    again: 'माफ़ कीजिए, समझ नहीं आया।',
    which: 'आपका मतलब कौन सा था?',
    nothing: 'पुष्टि के लिए कुछ नहीं है।',
    published: 'पब्लिश हो गया।',
    photo: 'फोटो चुनिए।',
    opening: (where) => `${where} खोल रहे हैं।`,
    undone: 'वापस कर दिया।',
    listening: 'सुन रहे हैं',
  },
  'bn-IN': {
    ask: (what) => `${what}? করতে হলে হ্যাঁ বলুন।`,
    saved: 'হয়ে গেছে। ড্রাফটে সেভ হয়েছে।',
    cancelled: 'বাতিল করা হল।',
    again: 'দুঃখিত, বুঝতে পারিনি।',
    which: 'কোনটা বলতে চাইছেন?',
    nothing: 'নিশ্চিত করার কিছু নেই।',
    published: 'প্রকাশ হয়ে গেছে।',
    photo: 'ছবি বেছে নিন।',
    opening: (where) => `${where} খুলছি।`,
    undone: 'আগের মতো করা হল।',
    listening: 'শুনছি',
  },
};

export const EXAMPLES: Record<VoiceLang, { title: string; lines: string[] }[]> = {
  'en-IN': [
    { title: 'Change words', lines: ['Change the home banner heading to Festive offer till Sunday', 'Set phone number to 98300 12345', 'Update the address to 12 Park Street, Kolkata'] },
    { title: 'Photos', lines: ['Change the banner photo', 'Replace the logo', 'Add a photo to the gallery in album New arrivals'] },
    { title: 'Add things', lines: ['Add a testimonial from Rina Das saying the service was quick', 'Add a notice: closed on Friday for Kali Puja'] },
    { title: 'Sections', lines: ['Hide the testimonials section', 'Show it again', 'Open contact details', 'Go to gallery'] },
    { title: 'Other languages', lines: ['Edit Bengali', 'Edit Hindi', 'Edit English'] },
    { title: 'Finish', lines: ['Publish', 'Undo', 'Show preview', 'Stop listening'] },
    { title: 'Typing by voice', lines: ['Click into a box, then say: write We are open all seven days', 'Start dictation / Stop dictation'] },
  ],
  'hi-IN': [
    { title: 'शब्द बदलें', lines: ['home banner heading ko Offer chalu hai kar do', 'होम बैनर की हेडिंग बदलकर ऑफ़र चालू है कर दो', 'phone number 98300 12345 karo'] },
    { title: 'फोटो', lines: ['banner ki photo badlo', 'gallery mein photo daal do'] },
    { title: 'जोड़ें', lines: ['kal dukaan band rahegi notice laga do'] },
    { title: 'सेक्शन', lines: ['testimonials section chhupa do', 'contact details kholo', 'गैलरी खोलो'] },
    { title: 'भाषा', lines: ['hindi mein edit karo', 'bangla edit karo', 'english edit karo'] },
    { title: 'पूरा करें', lines: ['publish kar do', 'wapas karo', 'preview dikhao', 'band karo'] },
    { title: 'जवाब', lines: ['haan / theek hai', 'nahi / rehne do'] },
  ],
  'bn-IN': [
    { title: 'লেখা বদলান', lines: ['home banner heading ta bodle Offer cholche koro', 'হোম ব্যানার হেডিং বদলে অফার চলছে করো', 'ফোন নম্বর ৯৮৩০০১২৩৪৫ করো'] },
    { title: 'ছবি', lines: ['banner er chobi bodlao', 'notun album e chobi jog koro'] },
    { title: 'যোগ করুন', lines: ['নোটিশ দাও: শুক্রবার দোকান বন্ধ'] },
    { title: 'সেকশন', lines: ['testimonials lukiye dao', 'testimonials abar dekhao', 'গ্যালারি খোলো'] },
    { title: 'ভাষা', lines: ['bangla te edit koro', 'hindi te edit koro', 'english edit koro'] },
    { title: 'শেষ করুন', lines: ['publish koro', 'ager moto koro', 'preview dekhao', 'bondho koro'] },
    { title: 'উত্তর', lines: ['hyan / thik ache', 'na / thak'] },
  ],
};
