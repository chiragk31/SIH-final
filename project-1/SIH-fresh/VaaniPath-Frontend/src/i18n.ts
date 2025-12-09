import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enIN from './i18n/locales/en-IN.json';
import hiIN from './i18n/locales/hi-IN.json';
import mrIN from './i18n/locales/mr-IN.json';
import bnIN from './i18n/locales/bn-IN.json';
import teIN from './i18n/locales/te-IN.json';
import taIN from './i18n/locales/ta-IN.json';
import guIN from './i18n/locales/gu-IN.json';
import knIN from './i18n/locales/kn-IN.json';
import mlIN from './i18n/locales/ml-IN.json';
import paIN from './i18n/locales/pa-IN.json';

// ... (other imports)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: enIN },
      hi: { translation: hiIN },
      mr: { translation: mrIN },
      bn: { translation: bnIN },
      te: { translation: teIN },
      ta: { translation: taIN },
      gu: { translation: guIN },
      kn: { translation: knIN },
      ml: { translation: mlIN },
      pa: { translation: paIN },
      // Map suffixed codes too just in case
      'en-IN': { translation: enIN },
      'hi-IN': { translation: hiIN },
      'mr-IN': { translation: mrIN },
    }
  });

export default i18n;
