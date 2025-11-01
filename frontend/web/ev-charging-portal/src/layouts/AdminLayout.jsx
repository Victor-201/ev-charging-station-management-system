import { memo } from "react";

const AdminLayout = ({ children }) => {
  return (
    <div className="layout-admin min-h-screen flex flex-col bg-white dark:bg-[var(--color-brand-700)] text-gray-800 dark:text-[var(--color-brand-50)]">
      <header className="p-4 bg-[var(--color-brand-500)] dark:bg-[var(--color-brand-600)] text-white font-semibold">
        Admin Header
      </header>
      <main className="flex-1 p-6 bg-gray-50 dark:bg-[var(--color-brand-600)]">
        {children}
      </main>
    </div>
  );
};

export default memo(AdminLayout);
