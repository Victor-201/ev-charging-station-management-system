import React from "react";

export default function Navbar({ onToggle }) {
  return (
    <header className="h-[68px] sticky top-0 z-40 flex items-center justify-between px-5 bg-gradient-to-b from-white to-[#f7fbff] border-b border-[rgba(8,12,20,0.04)]">
      {/* Left */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="bg-[rgba(15,98,254,0.06)] h-11 w-11 grid place-items-center rounded-xl transition-transform duration-100 active:scale-95 hover:bg-[rgba(15,98,254,0.1)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 grid place-items-center rounded-xl bg-gradient-to-b from-[#0f62fe] to-[#0353c3] text-white font-bold shadow-[0_6px_18px_rgba(15,98,254,0.12)]">
            ⚡
          </div>
          <div className="font-bold text-[15px] text-[#07122a]">
            EV Charging <span className="text-[#0f62fe] ml-1 font-extrabold">Admin</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="min-w-[260px] max-[900px]:hidden">
          <input
            className="w-full p-2.5 rounded-xl border border-[rgba(8,12,20,0.06)] shadow-[0_6px_18px_rgba(10,12,20,0.03)] outline-none text-[14px]"
            placeholder="Tìm kiếm trạm, phiên..."
            aria-label="Search"
          />
        </div>

        <button
          className="bg-transparent border-none h-10 w-10 rounded-xl cursor-pointer font-bold text-lg"
          title="Help"
        >
          ?
        </button>

        <div
          className="w-10 h-10 grid place-items-center rounded-xl font-bold bg-gradient-to-b from-[#111827] to-[#1f2937] text-white"
          title="Profile"
        >
          TD
        </div>
      </div>
    </header>
  );
}
