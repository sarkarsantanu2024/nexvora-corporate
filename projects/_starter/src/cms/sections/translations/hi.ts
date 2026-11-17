/**
 * Hindi wording for every section, keyed by section key. Written the way
 * people speak, not word for word from the English.
 *
 * Rules kept throughout: the business name is not translated; digits stay
 * Latin; nothing is claimed here that the English does not claim. Only text
 * is translated: photos, links and phone numbers fall through from English.
 * A list given here replaces the English list whole, so its rows repeat the
 * photo, icon and colour fields.
 */
import type { ContentData } from '../../types';

export const HI: Record<string, ContentData> = {
  'site.brand': {
    tagline: 'आपकी टैगलाइन यहाँ',
  },
  'site.contact': {},
  'site.header': {
    enquireLabel: 'पूछताछ करें',
    loginLabel: 'लॉगिन',
  },
  'site.footer': {
    about: 'कारोबार के बारे में एक छोटी लाइन यहाँ आएगी। इसे एडिट पैनल से बदलें।',
    note: 'सर्वाधिकार सुरक्षित।',
  },
  'site.cta': {
    heading: 'कुछ पूछना है? हमसे बात करें',
    text: 'फ़ोन करें, व्हाट्सऐप पर मैसेज भेजें या हमें लिखें। हम हर पूछताछ का जवाब देते हैं।',
    primaryLabel: 'संपर्क करें',
    whatsappLabel: 'व्हाट्सऐप पर बात करें',
    whatsappMessage: 'नमस्ते, मुझे और जानकारी चाहिए।',
  },

  'home.hero': {
    eyebrow: 'स्वागत है',
    heading: 'आपकी मुख्य हेडलाइन यहाँ आएगी',
    highlight: 'मुख्य हेडलाइन',
    text: 'एक-दो लाइन में बताइए कि कारोबार क्या करता है और किसके लिए है। इसे एडिट पैनल से बदलें।',
    imageAlt: 'नमूना बैनर फ़ोटो',
    primaryLabel: 'पूछताछ करें',
    secondaryLabel: 'हमारे बारे में',
    slides: [
      {
        type: 'image',
        image: '/images/hero.jpg',
        video: '',
        heading: 'आपकी मुख्य हेडलाइन यहाँ आएगी',
        text: 'एक-दो लाइन में बताइए कि कारोबार क्या करता है और किसके लिए है। इसे एडिट पैनल से बदलें।',
        buttonLabel: 'पूछताछ करें',
        buttonLink: '/contact#enquire',
        alt: 'नमूना बैनर फ़ोटो',
      },
      {
        type: 'image',
        image: '/images/sample-4.webp',
        video: '',
        heading: 'ऑफ़र या ख़बर के लिए दूसरी स्लाइड',
        text: 'हर स्लाइड की अपनी फ़ोटो, हेडिंग और बटन होता है। एडिट पैनल से स्लाइड जोड़ें, बदलें या हटाएँ।',
        buttonLabel: 'गैलरी देखें',
        buttonLink: '/gallery',
        alt: 'नमूना फ़ोटो',
      },
    ],
  },
  'home.marquee': {
    items: [{ text: 'सेवा एक' }, { text: 'सेवा दो' }, { text: 'सेवा तीन' }, { text: 'सेवा चार' }, { text: 'सेवा पाँच' }, { text: 'सेवा छह' }],
  },
  'home.intro': {
    eyebrow: 'स्वागत है',
    heading: 'कारोबार का छोटा सा परिचय',
    highlight: 'परिचय',
    text: 'यहाँ तीन-चार लाइनें लिखिए: कारोबार क्या करता है, कहाँ है और किस बात में अलग है। सीधी और सच्ची बात लिखिए।',
    imageAlt: 'नमूना फ़ोटो',
    image2Alt: 'नमूना फ़ोटो',
    points: [{ text: 'कारोबार के बारे में पहली बात' }, { text: 'कारोबार के बारे में दूसरी बात' }, { text: 'कारोबार के बारे में तीसरी बात' }],
    buttonLabel: 'हमारे बारे में और जानें',
  },
  'home.why': {
    eyebrow: 'हम ही क्यों',
    heading: 'आप हमसे क्या उम्मीद रख सकते हैं',
    highlight: 'उम्मीद',
    text: 'तीन-चार छोटे वादे, जिन्हें कारोबार सचमुच निभा सके।',
    items: [
      { title: 'पहली ख़ूबी', text: 'इसके बारे में एक-दो लाइन।', icon: 'star', color: 'sun' },
      { title: 'दूसरी ख़ूबी', text: 'इसके बारे में एक-दो लाइन।', icon: 'heart', color: 'coral' },
      { title: 'तीसरी ख़ूबी', text: 'इसके बारे में एक-दो लाइन।', icon: 'shield', color: 'mint' },
    ],
  },
  'home.gallery': {
    eyebrow: 'गैलरी',
    heading: 'हमारे काम की एक झलक',
    highlight: 'एक झलक',
    text: 'गैलरी की कुछ तस्वीरें।',
    buttonLabel: 'सारी तस्वीरें देखें',
  },
  'home.testimonials': {
    eyebrow: 'अच्छे शब्द',
    heading: 'लोग हमारे बारे में क्या कहते हैं',
    highlight: 'क्या कहते हैं',
  },
  'home.notices': {
    eyebrow: 'सूचना पट',
    heading: 'सूचनाएँ और कार्यक्रम',
    buttonLabel: 'सारी सूचनाएँ',
  },

  'about.top': {
    eyebrow: 'हमारे बारे में',
    heading: 'हम कौन हैं और क्या करते हैं',
    text: 'कारोबार का परिचय एक लाइन में।',
  },
  'about.story': {
    heading: 'हमारी कहानी',
    highlight: 'कहानी',
    text: 'यहाँ लिखिए कि कारोबार कैसे शुरू हुआ और आज क्या करता है।',
    text2: 'ज़रूरत हो तो दूसरा पैराग्राफ़। सिर्फ़ पहला दिखाना हो तो इसे ख़ाली छोड़ दें।',
    imageAlt: 'नमूना फ़ोटो',
  },
  'about.approach': {
    eyebrow: 'हम कैसे काम करते हैं',
    heading: 'जिन बातों पर आप भरोसा कर सकते हैं',
    highlight: 'भरोसा',
    items: [
      { title: 'पहली बात', text: 'इस बात के बारे में कुछ लाइनें।', icon: 'hand', color: 'sun' },
      { title: 'दूसरी बात', text: 'इस बात के बारे में कुछ लाइनें।', icon: 'chat', color: 'coral' },
      { title: 'तीसरी बात', text: 'इस बात के बारे में कुछ लाइनें।', icon: 'clock', color: 'mint' },
    ],
  },
  'about.mission': {
    missionHeading: 'हमारा लक्ष्य',
    mission: 'कारोबार का लक्ष्य एक-दो लाइन में लिखिए।',
    visionHeading: 'हमारा सपना',
    vision: 'लिखिए कि कुछ साल बाद आप कारोबार को कहाँ देखना चाहते हैं।',
  },
  'about.owner': {
    heading: 'मालिक का संदेश',
    message: 'यहाँ मालिक का छोटा सा संदेश लिखिए: कारोबार क्यों शुरू हुआ और ग्राहक क्या उम्मीद रख सकते हैं। तीन-चार वाक्य काफ़ी हैं।',
    name: 'मालिक का नाम',
    role: 'मालिक',
  },

  'gallery.top': {
    eyebrow: 'गैलरी',
    heading: 'तस्वीरें',
    text: 'बड़ा देखने के लिए तस्वीर पर टैप करें।',
    allLabel: 'सारी तस्वीरें',
    emptyText: 'तस्वीरें जल्द आ रही हैं। कृपया फिर देखिएगा।',
  },
  'notices.top': {
    eyebrow: 'सूचना पट',
    heading: 'सूचनाएँ और कार्यक्रम',
    text: 'ख़बरें, ऑफ़र और कार्यक्रम।',
    emptyText: 'अभी कोई सूचना नहीं है।',
  },
  'contact.top': {
    eyebrow: 'संपर्क',
    heading: 'हमसे बात करें',
    text: 'फ़ोन करें, व्हाट्सऐप पर मैसेज भेजें या यहाँ लिखें।',
  },
  'contact.form': {
    heading: 'हमें मैसेज भेजें',
    text: 'हम हर मैसेज पढ़ते हैं और फ़ोन पर जवाब देते हैं।',
    buttonLabel: 'मैसेज भेजें',
    successHeading: 'धन्यवाद। आपका मैसेज हमें मिल गया है।',
    successText: 'आपके दिए नंबर पर हम फ़ोन करेंगे। जल्दी हो तो व्हाट्सऐप पर मैसेज करें।',
    mapHeading: 'हमारा पता',
    mapButton: 'गूगल मैप में खोलें',
  },
};
