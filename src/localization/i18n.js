import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import he from './translations/he.json';
import en from './translations/en.json';
import { normalizeLocaleCode } from './localeUtils';

const i18n = new I18n({ he, en });

export { normalizeLocaleCode };

// Safe locale determination - default to English
const getSafeLocale = () => {
  if (Localization && typeof Localization.locale === "string" && Localization.locale.length > 0) {
    return normalizeLocaleCode(Localization.locale);
  }
  return "en";
};

i18n.locale = getSafeLocale();
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const changeLanguage = async (languageCode) => {
  const normalized = normalizeLocaleCode(languageCode);
  i18n.locale = normalized;
  await AsyncStorage.setItem("userLanguage", normalized);
};

export const loadLanguagePreference = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage && typeof savedLanguage === "string") {
      const normalized = normalizeLocaleCode(savedLanguage);
      i18n.locale = normalized;
      return normalized;
    } else {
      const supportedLocale = getSafeLocale();
      i18n.locale = supportedLocale;
      await AsyncStorage.setItem("userLanguage", supportedLocale);
      return supportedLocale;
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
    i18n.locale = 'en';
    return 'en';
  }
};

export const getCurrentLanguage = () => i18n.locale;
export const isRTL = () => i18n.locale === 'he';

export default i18n; 