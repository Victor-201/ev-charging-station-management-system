import { useState } from "react";
import { LanguageContext } from "@/contexts/LanguageContext";
import i18n from "@/i18n";

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(i18n.language || "en");

  const switchLang = (newLang) => {
    i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
