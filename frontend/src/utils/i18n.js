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
    modeVoice: 'आवाज से पूछें', modeImage: 'फोटो भेजें', modeSoil: 'मिट्टी जांच', modeMarket: 'बाजार भाव',
    tagline: 'कृषि सलाहकार AI', locationShort: 'स्थान', detectingLocation: 'लोकेशन पता की जा रही है', detectedLocation: 'पता चली लोकेशन',
    locationDenied: 'लोकेशन की अनुमति नहीं मिली', manualLocation: 'मैनुअल लोकेशन', districtPlaceholder: 'जिला, राज्य लिखें',
    detectAgain: 'मेरी लोकेशन दोबारा पता करें', selectCrop: 'फसल चुनें', locationDeniedBanner: 'लोकेशन एक्सेस नहीं मिला। आप अपनी लोकेशन मैनुअली लिख सकते हैं।', retry: 'फिर से',
    warning: 'चेतावनी', loadingDataPrefix: 'डेटा इकट्ठा हो रहा है:', loadingAnalyze: 'विश्लेषण हो रहा है...', loadingChecks: 'जांच हो रही है...', footer: 'KrishiMitra - CIBRC, ICAR और NPOP guidelines के अनुसार | किसान हेल्पलाइन: 1800-180-1551',
    imageTitle: 'फसल की फोटो भेजें', imageSubtitle: 'AI पहले जांच करेगा कि इमेज सच में फसल की है या नहीं, फिर उसी के हिसाब से विश्लेषण होगा।', imageWarning: 'सिर्फ असली फसल या पौधे की साफ फोटो दें। गलत इमेज से गलत परिणाम आएगा।', imagePreparing: 'AI के लिए फोटो तैयार और जांची जा रही है...', imageDrop: 'फसल की फोटो यहां डालें या क्लिक करें', imageHint: 'JPG, PNG, WEBP, मोबाइल इमेज - अधिकतम 20MB', imageReady: 'फोटो तैयार', imageAiCheck: 'AI इमेज जांच', imageDetectedCrop: 'पहचानी गई फसल / मैनुअल बदलें', imageWrongCrop: 'अगर AI ने फसल गलत पहचानी हो तो यहां से सही फसल चुनें।', imageWhatKnow: 'क्या जानना है?', identifyDisease: 'बीमारी पहचानें', identifyPest: 'कीट पहचानें', nutrientDeficiency: 'पोषण की कमी', suggestTreatment: 'उपाय बताएं', imageSubmit: 'फोटो भेजें और सलाह लें ->', imageAnalyzing: 'फोटो की जांच हो रही है...', privacy: 'आपकी फोटो सिर्फ विश्लेषण के लिए उपयोग होती है।', imageTypeError: 'कृपया इमेज फाइल अपलोड करें।', imageSizeError: 'फोटो 20MB से छोटी होनी चाहिए।', imageSmallError: 'फोटो बहुत छोटी है। कृपया साफ फोटो दें।', imageLoadError: 'फोटो लोड नहीं हो सकी। कृपया दूसरी इमेज आजमाएं।', imagePrepareError: 'फोटो AI के लिए तैयार नहीं हो पाई।',
    voiceTitle: 'अपनी समस्या बताएं', voiceSubtitle: 'बोलकर या लिखकर पूछें', listening: 'सुन रहा हूँ... रोकने के लिए दबाएं', startSpeaking: 'बोलना शुरू करें', voicePlaceholder: 'यहां अपना सवाल लिखें या बोलकर पूछें...', tryAsking: 'उदाहरण:', getAdvisory: 'सलाह लें ->',
    advisory: 'सलाह', advice: 'सलाह', actionSteps: 'क्या करें?', blocked: 'सलाह रोकी गई - compliance violation', safeAlternatives: 'सुरक्षित विकल्प:', sources: 'डेटा स्रोत:', session: 'सेशन', confidence: 'विश्वास', compliant: 'सही', warningShort: 'चेतावनी', blockedShort: 'रोका गया', sellNow: 'अभी बेचें', hold: 'रोक कर रखें', sellPartial: 'आधा बेचें', monitor: 'नजर रखें', belowMsp: 'MSP से कम - सहायता योजनाएं देखें', showDecisionAuditTrail: 'Decision audit trail देखें', hideDecisionAuditTrail: 'Decision audit trail छुपाएं', steps: 'स्टेप्स', locationInputTitle: 'यहां क्लिक करके अपनी लोकेशन मैनुअली लिखें',
  },
  mr: { modeVoice: 'Aawazene vichara', modeImage: 'Photo pathava', modeSoil: 'Mati tapasani', modeMarket: 'Bazaar bhav', tagline: 'Krishi salagar AI', districtPlaceholder: 'Jilha, rajya liha', detectAgain: 'Majhi location punha shodha', selectCrop: 'Pik niwda', imageTitle: 'Pikachi photo pathava', imageSubtitle: 'AI adhi check karel ki image khari pikachi aahe ka, mag analysis hoil.', imageWarning: 'Fakta khari pikachi clear photo dya.', voiceTitle: 'Tumchi samasya sanga', voiceSubtitle: 'Bolun kiwa lihun vichara', voicePlaceholder: 'Ithe prashna liha kiwa bolun vichara...', getAdvisory: 'Salah ghya ->', advisory: 'Salah', actionSteps: 'Kay karayche?' },
  gu: { modeVoice: 'Aawaj thi pucho', modeImage: 'Photo moklo', modeSoil: 'Mati tapas', modeMarket: 'Bazaar bhaav', tagline: 'Krushi salahkar AI', districtPlaceholder: 'Jillo, rajya lakho', detectAgain: 'Mari location fari detect karo', selectCrop: 'Fasal chuno', imageTitle: 'Fasal ni photo moklo', imageSubtitle: 'AI pela check karse ke image kharekhar fasal ni chhe ke nahi.', imageWarning: 'Fakta asli fasal ni clear photo aapo.', voiceTitle: 'Tamari samasya kaho', voiceSubtitle: 'Boline athva lakhine pucho', voicePlaceholder: 'Ahiya tamaro sawal lakho athva boline pucho...', getAdvisory: 'Salah lo ->', advisory: 'Salah', actionSteps: 'Shu karvu?' },
  pa: { modeVoice: 'Aawaz naal pucho', modeImage: 'Photo bhejo', modeSoil: 'Mitti jaanch', modeMarket: 'Bazaar bhaav', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Zila, raj likho', detectAgain: 'Meri location dubara labho', selectCrop: 'Fasal chuno', imageTitle: 'Fasal di photo bhejo', imageSubtitle: 'AI pehla check karegi ki image sach much fasal di hai ke nahi.', imageWarning: 'Sirf asli fasal di clear photo deo.', voiceTitle: 'Apni samasya dasso', voiceSubtitle: 'Bolke ya likhke pucho', voicePlaceholder: 'Ithe apna sawaal likho ya bolke pucho...', getAdvisory: 'Salah lao ->', advisory: 'Salah', actionSteps: 'Ki karna hai?' },
  bn: { modeVoice: 'Awaze jiggesh korun', modeImage: 'Photo pathan', modeSoil: 'Mati porikkha', modeMarket: 'Bazaar daam', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Jela, rajya likhun', detectAgain: 'Amar location abar detect korun', selectCrop: 'Fasal chuni', imageTitle: 'Fosholer photo pathan', imageSubtitle: 'AI age check korbe je image ta asole fosholer kina.', imageWarning: 'Shudhu ashol fosholer clear photo din.', voiceTitle: 'Apnar shomoshya bolun', voiceSubtitle: 'Bole ba likhe jiggesh korun', voicePlaceholder: 'Ekhane apnar proshno likhun ba bole jiggesh korun...', getAdvisory: 'Salah nin ->', advisory: 'Salah', actionSteps: 'Ki korben?' },
  ta: { modeVoice: 'Kural moolam kelungal', modeImage: 'Photo anuppungal', modeSoil: 'Mann parisu', modeMarket: 'Sandhai vilai', tagline: 'Vivasaya salahkar AI', districtPlaceholder: 'Mavattam, maanilam ezhudhungal', detectAgain: 'En location-ai marubadi detect seyyungal', selectCrop: 'Payir therndhedungal', imageTitle: 'Payir photo anuppungal', imageSubtitle: 'AI mudhalil indha image unmaiyana payir photo-va nu check pannum.', imageWarning: 'Unmaiyana payir oda clear photo kudungal.', voiceTitle: 'Ungal pirachanai sollungal', voiceSubtitle: 'Pesiyum illaiyel ezhudhiyum kelungal', voicePlaceholder: 'Inge ungal kelvi ezhudhungal allathu pesi kelungal...', getAdvisory: 'Salah perungal ->', advisory: 'Salah', actionSteps: 'Enna seiyanum?' },
  te: { modeVoice: 'Aawaz tho adagandi', modeImage: 'Photo pampandi', modeSoil: 'Matti parishka', modeMarket: 'Bazaar dhara', tagline: 'Krishi salahkar AI', districtPlaceholder: 'Jilla, rashtram rayandi', detectAgain: 'Na location malli detect cheyyandi', selectCrop: 'Panta enchukondi', imageTitle: 'Panta photo pampandi', imageSubtitle: 'AI munduga ee image nijamaina panta photo aa kaada ani check chestundi.', imageWarning: 'Asli panta clear photo ivvandi.', voiceTitle: 'Mee samasya cheppandi', voiceSubtitle: 'Maatladi leka rayi adagandi', voicePlaceholder: 'Ikkada mee prasna rayandi leka maatladi adagandi...', getAdvisory: 'Salah pondandi ->', advisory: 'Salah', actionSteps: 'Em cheyyali?' },
};

const CROP_LABELS = {
  wheat: { en: 'Wheat', hi: 'गेहूं', mr: 'Gahu', gu: 'Gehu', pa: 'Gehu', bn: 'Gehu', ta: 'Gothumai', te: 'Godhuma' },
  soybean: { en: 'Soybean', hi: 'सोयाबीन', mr: 'Soyabean', gu: 'Soyabean', pa: 'Soyabean', bn: 'Soyabean', ta: 'Soyabean', te: 'Soyabean' },
  rice: { en: 'Rice', hi: 'धान', mr: 'Dhan', gu: 'Dhan', pa: 'Dhaan', bn: 'Dhan', ta: 'Arisi', te: 'Vari' },
  gram: { en: 'Gram', hi: 'चना', mr: 'Chana', gu: 'Chana', pa: 'Chana', bn: 'Chhola', ta: 'Kadalai', te: 'Senaga' },
  mustard: { en: 'Mustard', hi: 'सरसों', mr: 'Mohari', gu: 'Sarson', pa: 'Sarson', bn: 'Sorse', ta: 'Kadugu', te: 'Avalu' },
  maize: { en: 'Maize', hi: 'मक्का', mr: 'Makka', gu: 'Makka', pa: 'Makka', bn: 'Bhutta', ta: 'Makka cholam', te: 'Mokka jonna' },
  tomato: { en: 'Tomato', hi: 'टमाटर', mr: 'Tamatar', gu: 'Tameta', pa: 'Tamatar', bn: 'Tomato', ta: 'Thakkali', te: 'Tamata' },
  lentil: { en: 'Lentil', hi: 'मसूर', mr: 'Masoor', gu: 'Masoor', pa: 'Masoor', bn: 'Mosur', ta: 'Masoor', te: 'Masoor' },
};

const VOICE_EXAMPLES = {
  en: ['My wheat leaves are turning yellow, what should I do?', 'There are insects in my soybean crop.', 'What is today\'s mandi price of gram?'],
  hi: ['मेरे गेहूं में पीले पत्ते आ रहे हैं, क्या करूं?', 'सोयाबीन की फसल में कीड़े लग गए हैं।', 'आज मंडी में चना का भाव क्या है?'],
  mr: ['Majhya gahuche paane pivali hot aahet, kay karu?', 'Soyabean pikat kid lagli aahe.', 'Aaj chana cha mandi bhav kay aahe?'],
  gu: ['Mara gehu na panna pila thai gaya chhe, shu karu?', 'Soyabean ni fasal ma keet lagi gaya chhe.', 'Aaje chana no mandi bhaav shu chhe?'],
  pa: ['Mere gehu de patte peele ho rahe ne, ki karaan?', 'Soyabean di fasal vich keede lag gaye ne.', 'Ajj chane da mandi bhaav ki hai?'],
  bn: ['Amar gehu patagulo holud hoye jacche, ki korbo?', 'Soyabean foshole poka legeche.', 'Aaj cholar mandi daam koto?'],
  ta: ['En gehu ilai manjal aagiradhu, enna seiyanum?', 'Soyabean payiril poochi vandhirukku.', 'Inniku chana mandi vilai enna?'],
  te: ['Na gehu aakulu pasupu ga avutunnayi, em cheyyali?', 'Soyabean pantalo keetakalu unnayi.', 'I roju chana mandi dhara entha?'],
};

const QUESTION_OPTIONS = {
  en: ['Identify disease', 'Identify pest', 'Nutrient deficiency', 'Suggest treatment'],
  hi: ['बीमारी पहचानें', 'कीट पहचानें', 'पोषण की कमी', 'उपाय बताएं'],
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
  return includeAuto ? [{ value: '', label: language === 'en' ? 'Let AI detect' : 'AI से पहचानने दें' }, ...options] : options;
}

export function voiceExamples(language) {
  return VOICE_EXAMPLES[language] || VOICE_EXAMPLES.hi;
}

export function questionOptions(language) {
  return QUESTION_OPTIONS[language] || QUESTION_OPTIONS.hi;
}
