import { memo } from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout min-h-screen flex items-center justify-center 
      bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-700)]">
      <div className="auth-box bg-white dark:bg-[var(--color-brand-600)] shadow-md rounded-xl p-6 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default memo(AuthLayout);
