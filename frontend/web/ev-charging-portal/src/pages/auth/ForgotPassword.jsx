import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";

// ✅ Schema
const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
});

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth(); // ⚙️ Hàm cần định nghĩa trong useAuth()
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[var(--color-brand-700)] transition-colors px-4">
      <div className="w-full max-w-md card space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t("ForgotPassword")}</h2>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm">{t("auth.email")}</label>
              <div className="flex items-center border rounded-md px-3 py-2 dark:bg-[var(--color-brand-700)]">
                <Mail size={18} className="text-gray-500 dark:text-[var(--color-brand-50)]" />
                <input
                  type="email"
                  {...register("email")}
                  className="flex-1 bg-transparent outline-none px-2"
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{t(errors.email.message)}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={18} />
              {loading ? t("auth.sending") : t("auth.sendResetLink")}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <CheckCircle className="text-green-600 w-12 h-12 mx-auto" />
            <h3 className="font-semibold">{t("auth.resetLinkSent")}</h3>
            <p className="text-sm text-gray-600">
              {t("auth.checkInbox")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
