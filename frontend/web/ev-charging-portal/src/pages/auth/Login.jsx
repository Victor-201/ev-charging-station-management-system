import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { ROUTERS } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/images/logo.png";

const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const authCtx = useAuth();
  const loginFn = authCtx?.login ?? authCtx;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
  try {
    setLoading(true);
    setErrorMessage("");

    const user = await loginFn({ ...data });

    if (!user?.role) throw new Error("Missing user role");

    if (user.role === "admin") {
      navigate(ROUTERS.ADMIN.DASHBOARD);
    } else if (user.role === "staff") {
      navigate(ROUTERS.STAFF.DASHBOARD);
    } else {
      navigate("/"); 
    }

  } catch (err) {
    const serverMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Invalid email or password";
    setErrorMessage(serverMessage);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.25)] overflow-hidden">

      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* LEFT — EV Visual */}
        <div className="hidden md:flex flex-col justify-center items-center 
          bg-gradient-to-b from-blue-800 to-blue-900 text-white p-12 gap-6 shadow-inner">

          <div className="bg-white p-3 md:p-4 rounded-full shadow-xl border border-gray-200
            w-44 h-44 md:w-48 md:h-48 flex items-center justify-center">
            <img src={logo} alt="EV Logo" className="w-36 h-36 md:w-40 md:h-40 object-contain" />
          </div>

          <h1 className="text-3xl font-bold tracking-wide">
            EV Charging Portal
          </h1>

          <p className="text-blue-200 text-sm tracking-wide">
            Centralized Control Panel for Stations
          </p>

        </div>

        {/* RIGHT — LOGIN FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center">

          <div className="flex justify-end mb-6 gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>

          {/* BEAUTIFUL FORM CARD */}
          <div className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Sign in to your EV Charging Portal to manage stations and view analytics</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* EMAIL */}
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Email</label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus-within:ring-2 ring-blue-400 transition">
                  <Mail className="text-blue-700 dark:text-blue-300" size={20} />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder={t("auth.emailPlaceholder")}
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{t(errors.email.message)}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Password</label>
                  {/* Removed forgot-password link per requirement: no password reset */}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus-within:ring-2 ring-blue-400 transition">
                  <Lock className="text-blue-700 dark:text-blue-300" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{t(errors.password.message)}</p>}
              </div>

              {/* REMEMBER + ERROR */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-blue-600" />
                  Remember me
                </label>
                {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md transform active:scale-98 transition disabled:opacity-60"
              >
                <LogIn size={18} />
                {loading ? t("auth.loading") : t("auth.loginBtn")}
              </button>

              {/* Removed social / register section — registration disabled for staff/admin */}

            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
