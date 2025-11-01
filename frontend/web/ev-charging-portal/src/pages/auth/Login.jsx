import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { ROUTERS } from "@/utils/constants";
import { useNavigate } from "react-router-dom";

// Yup validation schema
const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
  remember: yup.boolean(),
});

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    await login(data.email, data.password, data.remember);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[var(--color-brand-700)] transition-colors px-4">
      <div className="w-full max-w-md card space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t("auth.login")}</h2>

          <div className="flex items-center gap-2">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        {/* Form */}
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

          {/* Password */}
          <div>
            <label className="text-sm">{t("auth.password")}</label>
            <div className="flex items-center border rounded-md px-3 py-2 dark:bg-[var(--color-brand-700)]">
              <Lock size={18} className="text-gray-500 dark:text-[var(--color-brand-50)]" />
              <input
                type="password"
                {...register("password")}
                className="flex-1 bg-transparent outline-none px-2"
                placeholder={t("auth.passwordPlaceholder")}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{t(errors.password.message)}</p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register("remember")} />
              {t("auth.remember")}
            </label>

            <button
              type="button"
              onClick={() => navigate(ROUTERS.PUBLIC.FORGOT_PASSWORD)}
              className="text-sm underline hover:opacity-80"
            >
              {t("auth.forgot")}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? t("auth.loading") : t("auth.loginBtn")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
