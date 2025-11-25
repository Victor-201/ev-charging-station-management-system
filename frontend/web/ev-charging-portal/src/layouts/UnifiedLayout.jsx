import React, { useState, memo } from "react";
import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Header";

const UnifiedLayout = ({ children, mode = "staff" }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* NAVBAR */}
      <Navbar onToggle={() => setOpen((v) => !v)} mode={mode} />

      {/* BODY */}
      <div className="flex items-start gap-5 transition-all duration-300">
        {/* SIDEBAR DÙNG CHUNG */}
        <Sidebar active={open} mode={mode} />

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 py-6 transition-all duration-300 max-[900px]:px-4">
          <div className="max-w-[1100px] mx-auto w-full">
            <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_rgba(8,12,20,0.06)] dark:bg-gray-900 dark:text-white">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default memo(UnifiedLayout);
