import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import hi from './locales/hi.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
      'pt-BR': { translation: ptBR },
      hi: { translation: hi },
      ru: { translation: ru },
      ja: { translation: ja },
      zh: { translation: zh }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'fr', 'de', 'es', 'pt-BR', 'hi', 'ru', 'ja', 'zh'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false }
  });

export default i18n;
