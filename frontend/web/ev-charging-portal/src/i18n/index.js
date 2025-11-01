import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const enModules = import.meta.glob("@/i18n/locales/en/*.json", { eager: true });
const viModules = import.meta.glob("@/i18n/locales/vi/*.json", { eager: true });

const reduceModules = (modules) =>
  Object.values(modules).reduce(
    (acc, module) => ({ ...acc, ...module.default }),
    {}
  );

const resources = {
  en: { translation: reduceModules(enModules) },
  vi: { translation: reduceModules(viModules) },
};

const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources,
});

export default i18n;
