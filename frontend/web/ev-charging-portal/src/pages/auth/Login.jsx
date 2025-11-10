// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

/** Helper: decode JWT payload (safe: supports base64url) */
const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // pad
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const LoginPage = () => {
  const { t } = useTranslation();
  const authCtx = useAuth();
  // support both { login, auth } or { login } shapes
  const loginFn = authCtx?.login ?? authCtx;
  const authState = authCtx?.auth ?? authCtx?.user ?? authCtx?.user; // try common places
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { remember: true },
  });

  const resolveRoleFromContextOrToken = () => {
    // 1) try authState.user?.role or authState.role
    const roleFromAuth =
      authState?.user?.role ?? authState?.role ?? authState?.roles ?? null;
    if (roleFromAuth) return roleFromAuth;

    // 2) try tokens in localStorage/sessionStorage with common keys
    const keys = ["token", "access_token", "accessToken"];
    for (const k of keys) {
      const tok =
        localStorage.getItem(k) ??
        sessionStorage.getItem(k) ??
        (typeof window !== "undefined" ? window[k] : null);
      if (tok) {
        const payload = decodeJwtPayload(tok);
        if (payload?.role) return payload.role;
        if (payload?.roles) return payload.roles;
        // sometimes user object embedded
        if (payload?.user?.role) return payload.user.role;
      }
    }
    return null;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      // Support both login(email, password, remember) and login({ ... })
      let loginResult;
      if (typeof loginFn === "function") {
        try {
          // try calling as login({ email, password, remember })
          loginResult = await loginFn({
            email: data.email,
            password: data.password,
            remember: data.remember,
          });
        } catch (err) {
          // if provider expects positional args (email, password, remember)
          // try fallback
          if (err) {
            // second attempt
            loginResult = await loginFn(data.email, data.password, data.remember);
          } else {
            throw err;
          }
        }
      } else {
        throw new Error("Auth provider không hợp lệ.");
      }

      // try to read role from returned result, context, or token
      let role =
        loginResult?.user?.role ??
        loginResult?.role ??
        resolveRoleFromContextOrToken();

      // If still not found, try reading from context (some providers update context after login)
      if (!role) {
        const fromCtx =
          authCtx?.user?.role ?? authCtx?.auth?.user?.role ?? authCtx?.role ?? null;
        role = fromCtx ?? resolveRoleFromContextOrToken();
      }

      // fallback defaults for routes
      const staffRoute = ROUTERS?.STAFF?.DASHBOARD ?? "/staff/dashboard";
      const adminRoute = ROUTERS?.ADMIN?.DASHBOARD ?? "/admin/dashboard";
      const userRoute = ROUTERS?.DASHBOARD ?? "/dashboard";

      if (role === "staff") {
        navigate(staffRoute);
      } else if (role === "admin") {
        navigate(adminRoute);
      } else {
        // default user
        navigate(userRoute);
      }
    } catch (err) {
      // Try common axios / fetch error shapes
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
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

          {/* Error message */}
          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

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
