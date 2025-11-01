import { memo } from "react";

const StaffLayout = ({ children }) => {
  return (
    <div className="layout-staff min-h-screen flex flex-col bg-white dark:bg-[var(--color-brand-700)] text-gray-800 dark:text-[var(--color-brand-50)]">
      <header className="p-4 bg-[var(--color-brand-300)] dark:bg-[var(--color-brand-600)] text-white font-semibold">
        Staff Header
      </header>
      <main className="flex-1 p-6 bg-gray-50 dark:bg-[var(--color-brand-600)]">
        {children}
      </main>
    </div>
  );
};

export default memo(StaffLayout);
