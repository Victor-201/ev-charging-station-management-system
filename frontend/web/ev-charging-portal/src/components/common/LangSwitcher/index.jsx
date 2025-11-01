import { useTranslation } from "react-i18next";

const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggleLang = () => {
    const next = current === "en" ? "vi" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button
      onClick={toggleLang}
      className="px-2 py-1 text-sm border rounded-md hover:opacity-80"
    >
      {current === "en" ? "🇺🇸 EN" : "🇻🇳 VI"}
    </button>
  );
};

export default LangSwitcher;
