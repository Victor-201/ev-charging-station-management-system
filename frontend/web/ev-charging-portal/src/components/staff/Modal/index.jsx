import React, { useEffect } from "react";

export default function Modal({ open, title, children, onClose, className = "" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-5 bg-[rgba(6,8,15,0.6)]"
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`
          w-[min(720px,94%)] max-h-[90vh] overflow-auto
          rounded-[14px] border border-[rgba(10,12,20,0.04)]
          bg-gradient-to-b from-[#ffffff] to-[#fbfdff]
          shadow-[0_20px_50px_rgba(8,12,20,0.18)]
          animate-[modalPop_0.22s_cubic-bezier(.2,.9,.3,1)_forwards]
          transform translate-y-[12px] scale-[.995] opacity-0
          ${className}
          max-[520px]:w-full max-[520px]:h-full max-[520px]:rounded-none max-[520px]:max-h-[100vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(5,7,12,0.04)]">
          <h3 className="text-[16px] font-bold text-[#0b1320] m-0">{title}</h3>
          <button
            className="text-[18px] p-1.5 rounded-md hover:bg-[rgba(10,12,20,0.03)] transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-[#111827] leading-relaxed max-[520px]:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
