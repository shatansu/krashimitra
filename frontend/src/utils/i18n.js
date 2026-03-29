export const LANGUAGE_OPTIONS = [
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
];

export const SPEECH_LOCALES = {
  hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
};

export const SUPPORTED_CROPS = ['wheat', 'soybean', 'rice', 'gram', 'mustard', 'maize', 'tomato', 'lentil'];

const TEXT = {
  en: {
    modeVoice: 'Voice Query', modeImage: 'Crop Photo', modeSoil: 'Soil Analysis', modeMarket: 'Market Price',
    tagline: 'Krishi advisor AI', locationShort: 'Loc', detectingLocation: 'Detecting location', detectedLocation: 'Detected location',
    locationDenied: 'Location access denied', manualLocation: 'Manual location', districtPlaceholder: 'Enter district, state',
    detectAgain: 'Detect my location again', selectCrop: 'Select crop', locationDeniedBanner: 'Location access was denied. You can type any location manually.', retry: 'Retry',
    warning: 'Warning', loadingDataPrefix: 'Collecting data for', loadingAnalyze: 'Analyzing...', loadingChecks: 'Running compliance checks...', footer: 'KrishiMitra - Compliant with CIBRC, ICAR and NPOP guidelines | Kisan Helpline: 1800-180-1551',
    imageTitle: 'Upload crop photo', imageSubtitle: 'AI will first check whether the image is actually a crop photo, then analyze it.', imageWarning: 'Upload only a real and clear crop or plant photo. Wrong images will produce wrong results.', imagePreparing: 'Preparing and inspecting photo for AI...', imageDrop: 'Drop crop photo here or click', imageHint: 'JPG, PNG, WEBP, mobile images - max 20MB', imageReady: 'Photo ready', imageAiCheck: 'AI image check', imageDetectedCrop: 'Detected crop / change manually', imageWrongCrop: 'If AI detected the wrong crop, choose the correct crop here.', imageWhatKnow: 'What to know?', identifyDisease: 'Identify disease', identifyPest: 'Identify pest', nutrientDeficiency: 'Nutrient deficiency', suggestTreatment: 'Suggest treatment', imageSubmit: 'Analyze and get advice ->', imageAnalyzing: 'Analyzing photo...', privacy: 'Your photo is used only for analysis.', imageTypeError: 'Please upload an image file.', imageSizeError: 'Photo must be smaller than 20MB.', imageSmallError: 'Photo is too small. Please upload a clearer photo.', imageLoadError: 'Photo could not be loaded. Please try another image.', imagePrepareError: 'Unable to prepare image for AI.',
    voiceTitle: 'Ask your question', voiceSubtitle: 'Speak or type your query', listening: 'Listening... tap to stop', startSpeaking: 'Tap to speak', voicePlaceholder: 'Type or speak your query here...', tryAsking: 'Try asking:', getAdvisory: 'Get advisory ->',
    advisory: 'Advisory', advice: 'Advice', actionSteps: 'Action steps', blocked: 'Advisory blocked - Compliance violation', safeAlternatives: 'Safe alternatives:', sources: 'Sources:', session: 'Session', confidence: 'confident', compliant: 'Compliant', warningShort: 'Warning', blockedShort: 'Blocked', sellNow: 'Sell now', hold: 'Hold', sellPartial: 'Sell partial', monitor: 'Monitor', belowMsp: 'Below MSP - check support schemes', showDecisionAuditTrail: 'Show decision audit trail', hideDecisionAuditTrail: 'Hide decision audit trail', steps: 'steps', locationInputTitle: 'Click here and type any location manually',
  },
  hi: {
    modeVoice: 'Aawaz se poochhein', modeImage: 'Photo bhejein', modeSoil: 'Mitti jaanch', modeMarket: 'Bazaar bhaav',
    tagline: 'Krishi salahkar AI', locationShort: 'Loc', detectingLocation: 'Location detect ho rahi hai', detectedLocation: 'Detected location',
    locationDenied: 'Location access deny hua', manualLocation: 'Manual location', districtPlaceholder: 'Jila, rajya likhein',
    detectAgain: 'Meri location dubara detect karein', selectCrop: 'Fasal chunein', locationDeniedBanner: 'Location access deny ho gaya. Aap manually location type kar sakte hain.', retry: 'Retry',
    warning: 'Chetavani', loadingDataPrefix: 'Data ikattha ho raha hai:', loadingAnalyze: 'Vishleshan ho raha hai...', loadingChecks: 'Jaach ho rahi hai...', footer: 'KrishiMitra - CIBRC, ICAR aur NPOP guidelines ke anusar | Kisan Helpline: 1800-180-1551',
    imageTitle: 'Fasal ki photo bhejein', imageSubtitle: 'AI pehle check karega ki image sach me fasal ki hai ya nahi, phir usi ke hisaab se analysis hoga.', imageWarning: 'Sirf asli fasal ya paudhe ki clear photo dijiye. Wrong image se wrong result aayega.', imagePreparing: 'AI ke liye photo prepare aur inspect ho rahi hai...', imageDrop: 'Fasal ki photo yahan daalein ya click karein', imageHint: 'JPG, PNG, WEBP, mobile images - max 20MB', imageReady: 'Photo ready', imageAiCheck: 'AI image check', imageDetectedCrop: 'Detected crop / manually change crop', imageWrongCrop: 'Agar AI ne crop galat detect kiya ho to yahin se sahi crop choose karein.', imageWhatKnow: 'Kya janna hai?', identifyDisease: 'Bimari pehchanein', identifyPest: 'Keet pehchanein', nutrientDeficiency: 'Poshan ki kami', suggestTreatment: 'Upay batayein', imageSubmit: 'Photo bhejein aur salah lein ->', imageAnalyzing: 'Photo ki jaanch ho rahi hai...', privacy: 'Aapki photo sirf analysis ke liye use hoti hai.', imageTypeError: 'Kripya image file upload karein.', imageSizeError: 'Photo 20MB se chhoti honi chahiye.', imageSmallError: 'Photo bahut chhoti hai. Clear photo dijiye.', imageLoadError: 'Photo load nahi ho saki. Kripya doosri image try karein.', imagePrepareError: 'Photo AI ke liye prepare nahi ho paayi.',
    voiceTitle: 'Apni samasya batayein', voiceSubtitle: 'Bolkar ya likhkar poochhein', listening: 'Sun raha hoon... stop karne ke liye dabayein', startSpeaking: 'Bolna shuru karein', voicePlaceholder: 'Yahan apna sawaal likhein ya bolkar poochhein...', tryAsking: 'Udaharan:', getAdvisory: 'Salah lein ->',
    advisory: 'Salah', advice: 'Salah', actionSteps: 'Kya karein?', blocked: 'Salah blocked - compliance violation', safeAlternatives: 'Safe alternatives:', sources: 'Data sources:', session: 'Session', confidence: 'vishwas', compliant: 'Sahi', warningShort: 'Chetavani', blockedShort: 'Roka gaya', sellNow: 'Abhi bechein', hold: 'Rok kar rakhein', sellPartial: 'Aadha bechein', monitor: 'Nazar rakhein', belowMsp: 'MSP se kam - support schemes dekhein', showDecisionAuditTrail: 'Decision audit trail dekhein', hideDecisionAuditTrail: 'Decision audit trail chhupayein', steps: 'steps', locationInputTitle: 'Yahan click karke apni location manually likhein',
  },
  mr: { modeVoice: 'Aawazene vichara', modeImage: 'Photo pathava', modeSoil: 'Mati tapasani', modeMarket: 'Bazaar bhav', tagline: 'Krishi salagar AI', districtPlaceholder: 'Jilha, rajya liha', detectAgain: 'Majhi location punha shodha', selectCrop: 'Pik niwda', imageTitle: 'Pikachi photo pathava', imageSubtitle: 'AI adhi check karel ki image khari pikachi aahe ka, mag analysis hoil.', imageWarning: 'Fakta khari pikachi clear photo dya.', voiceTitle: 'Tumchi samasya sanga', voiceSubtitle: 'Bolun kiwa lihun vichara', voicePlaceholder: 'Ithe prashna liha kiwa bolun vichara...', getAdvisory: 'Salah ghya ->', advisory: 'Salah', actionSteps: 'Kay karayche?' },
  gu: { modeVoice: 'Aawaj thi pucho', modeImage: 'Photo moklo', modeSoil: 'Mati tapas', modeMarket: 'Bazaar bhaav', tagline: 'Krushi salahkar AI', districtPlaceholder: 'Jillo, rajya lakho', detectAgain: 'Mari location fari detect karo', selectCrop: 'Fasal chuno', imageTitle: 'Fasal ni photo moklo', imageSubtitle: 'AI pela check karse ke image kharekhar fasal ni chhe ke nahi.', imageWarning: 'Fakta asli fasal ni clear photo aapo.', voiceTitle: 'Tamari samasya kaho', voiceSubtitle: 'Boline athva lakhine pucho', voicePlaceholder: 'Ahiya tamaro sawal lakho athva boline pucho...', getAdvisory: 'Salah lo ->', advisory: 'Salah', actionSteps: 'Shu karvu?' },
  pa: { modeVoice: 'Aawaz naal pucho', modeImage: 'Photo bhejo', modeSoil: 'Mitti jaanch', modeMarket: 'Bazaar bhaav', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Zila, raj likho', detectAgain: 'Meri location dubara labho', selectCrop: 'Fasal chuno', imageTitle: 'Fasal di photo bhejo', imageSubtitle: 'AI pehla check karegi ki image sach much fasal di hai ke nahi.', imageWarning: 'Sirf asli fasal di clear photo deo.', voiceTitle: 'Apni samasya dasso', voiceSubtitle: 'Bolke ya likhke pucho', voicePlaceholder: 'Ithe apna sawaal likho ya bolke pucho...', getAdvisory: 'Salah lao ->', advisory: 'Salah', actionSteps: 'Ki karna hai?' },
  bn: { modeVoice: 'Awaze jiggesh korun', modeImage: 'Photo pathan', modeSoil: 'Mati porikkha', modeMarket: 'Bazaar daam', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Jela, rajya likhun', detectAgain: 'Amar location abar detect korun', selectCrop: 'Fasal chuni', imageTitle: 'Fosholer photo pathan', imageSubtitle: 'AI age check korbe je image ta asole fosholer kina.', imageWarning: 'Shudhu ashol fosholer clear photo din.', voiceTitle: 'Apnar shomoshya bolun', voiceSubtitle: 'Bole ba likhe jiggesh korun', voicePlaceholder: 'Ekhane apnar proshno likhun ba bole jiggesh korun...', getAdvisory: 'Salah nin ->', advisory: 'Salah', actionSteps: 'Ki korben?' },
  ta: { modeVoice: 'Kural moolam kelungal', modeImage: 'Photo anuppungal', modeSoil: 'Mann parisu', modeMarket: 'Sandhai vilai', tagline: 'Vivasaya salahkar AI', districtPlaceholder: 'Mavattam, maanilam ezhudhungal', detectAgain: 'En location-ai marubadi detect seyyungal', selectCrop: 'Payir therndhedungal', imageTitle: 'Payir photo anuppungal', imageSubtitle: 'AI mudhalil indha image unmaiyana payir photo-va nu check pannum.', imageWarning: 'Unmaiyana payir oda clear photo kudungal.', voiceTitle: 'Ungal pirachanai sollungal', voiceSubtitle: 'Pesiyum illaiyel ezhudhiyum kelungal', voicePlaceholder: 'Inge ungal kelvi ezhudhungal allathu pesi kelungal...', getAdvisory: 'Salah perungal ->', advisory: 'Salah', actionSteps: 'Enna seiyanum?' },
  te: { modeVoice: 'Aawaz tho adagandi', modeImage: 'Photo pampandi', modeSoil: 'Matti parishka', modeMarket: 'Bazaar dhara', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Jilla, rashtram rayandi', detectAgain: 'Na location malli detect cheyyandi', selectCrop: 'Panta enchukondi', imageTitle: 'Panta photo pampandi', imageSubtitle: 'AI munduga ee image nijamaina panta photo aa kaada ani check chestundi.', imageWarning: 'Asli panta clear photo ivvandi.', voiceTitle: 'Mee samasya cheppandi', voiceSubtitle: 'Maatladi leka rayi adagandi', voicePlaceholder: 'Ikkada mee prasna rayandi leka maatladi adagandi...', getAdvisory: 'Salah pondandi ->', advisory: 'Salah', actionSteps: 'Em cheyyali?' },
};

const CROP_LABELS = {
  wheat: { en: 'Wheat', hi: 'Gehu', mr: 'Gahu', gu: 'Gehu', pa: 'Gehu', bn: 'Gehu', ta: 'Gothumai', te: 'Godhuma' },
  soybean: { en: 'Soybean', hi: 'Soyabean', mr: 'Soyabean', gu: 'Soyabean', pa: 'Soyabean', bn: 'Soyabean', ta: 'Soyabean', te: 'Soyabean' },
  rice: { en: 'Rice', hi: 'Dhan', mr: 'Dhan', gu: 'Dhan', pa: 'Dhaan', bn: 'Dhan', ta: 'Arisi', te: 'Vari' },
  gram: { en: 'Gram', hi: 'Chana', mr: 'Chana', gu: 'Chana', pa: 'Chana', bn: 'Chhola', ta: 'Kadalai', te: 'Senaga' },
  mustard: { en: 'Mustard', hi: 'Sarson', mr: 'Mohari', gu: 'Sarson', pa: 'Sarson', bn: 'Sorse', ta: 'Kadugu', te: 'Avalu' },
  maize: { en: 'Maize', hi: 'Makka', mr: 'Makka', gu: 'Makka', pa: 'Makka', bn: 'Bhutta', ta: 'Makka cholam', te: 'Mokka jonna' },
  tomato: { en: 'Tomato', hi: 'Tamatar', mr: 'Tamatar', gu: 'Tameta', pa: 'Tamatar', bn: 'Tomato', ta: 'Thakkali', te: 'Tamata' },
  lentil: { en: 'Lentil', hi: 'Masoor', mr: 'Masoor', gu: 'Masoor', pa: 'Masoor', bn: 'Mosur', ta: 'Masoor', te: 'Masoor' },
};

const VOICE_EXAMPLES = {
  en: ['My wheat leaves are turning yellow, what should I do?', 'There are insects in my soybean crop.', 'What is today\'s mandi price of gram?'],
  hi: ['Mere gehu me peele patte aa rahe hain, kya karun?', 'Soyabean ki fasal me keede lag gaye hain.', 'Aaj mandi me chana ka bhaav kya hai?'],
  mr: ['Majhya gahuche paane pivali hot aahet, kay karu?', 'Soyabean pikat kid lagli aahe.', 'Aaj chana cha mandi bhav kay aahe?'],
  gu: ['Mara gehu na panna pila thai gaya chhe, shu karu?', 'Soyabean ni fasal ma keet lagi gaya chhe.', 'Aaje chana no mandi bhaav shu chhe?'],
  pa: ['Mere gehu de patte peele ho rahe ne, ki karaan?', 'Soyabean di fasal vich keede lag gaye ne.', 'Ajj chane da mandi bhaav ki hai?'],
  bn: ['Amar gehu patagulo holud hoye jacche, ki korbo?', 'Soyabean foshole poka legeche.', 'Aaj cholar mandi daam koto?'],
  ta: ['En gehu ilai manjal aagiradhu, enna seiyanum?', 'Soyabean payiril poochi vandhirukku.', 'Inniku chana mandi vilai enna?'],
  te: ['Na gehu aakulu pasupu ga avutunnayi, em cheyyali?', 'Soyabean pantalo keetakalu unnayi.', 'I roju chana mandi dhara entha?'],
};

const QUESTION_OPTIONS = {
  en: ['Identify disease', 'Identify pest', 'Nutrient deficiency', 'Suggest treatment'],
  hi: ['Bimari pehchanein', 'Keet pehchanein', 'Poshan ki kami', 'Upay batayein'],
  mr: ['Rog olkha', 'Kid olkha', 'Poshanachi kamtarata', 'Upay sanga'],
  gu: ['Rog olkho', 'Keet olkho', 'Poshan ni kami', 'Upay batao'],
  pa: ['Bimari pachhano', 'Keet pachhano', 'Poshan di kami', 'Upay dasso'],
  bn: ['Rog chinun', 'Poka chinun', 'Poshoner obhab', 'Upay bolun'],
  ta: ['Noi kandupidikkavum', 'Poochi kandupidikkavum', 'Poshana kuraivu', 'Theervu sollungal'],
  te: ['Rogam gurthinchu', 'Keetakam gurthinchu', 'Poshaka lopam', 'Pariharam cheppandi'],
};

export function t(language, key) {
  return TEXT[language]?.[key] || TEXT.hi[key] || TEXT.en[key] || key;
}

export function cropLabel(language, crop) {
  if (!crop) return t(language, 'selectCrop');
  return CROP_LABELS[crop]?.[language] || CROP_LABELS[crop]?.hi || CROP_LABELS[crop]?.en || crop;
}

export function cropOptions(language, includeAuto = true) {
  const options = SUPPORTED_CROPS.map((value) => ({ value, label: cropLabel(language, value) }));
  return includeAuto ? [{ value: '', label: language === 'en' ? 'Let AI detect' : 'AI se detect hone do' }, ...options] : options;
}

export function voiceExamples(language) {
  return VOICE_EXAMPLES[language] || VOICE_EXAMPLES.hi;
}

export function questionOptions(language) {
  return QUESTION_OPTIONS[language] || QUESTION_OPTIONS.hi;
}
