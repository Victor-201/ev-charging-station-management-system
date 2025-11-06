import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[rgba(8,12,20,0.06)] bg-gradient-to-b from-white to-[#f7fbff] px-5 py-4 shadow-[0_6px_18px_rgba(8,12,20,0.04)] dark:from-[#0b1220] dark:to-[#0e1626] dark:border-[rgba(255,255,255,0.06)]">
      <div>
        <div className="text-lg font-extrabold text-[#07122a] dark:text-white">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[13px] text-gray-600 dark:text-gray-300">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
