import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import vi from "./locales/vi.json";

const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
});

export default i18n;
