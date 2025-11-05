import React, { useState, memo } from "react";
import AdminNavbar from "../components/admin/Navbar";
import AdminSidebar from "../components/admin/Sidebar";

const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Top navigation */}
      <AdminNavbar onToggle={() => setOpen((v) => !v)} />

      {/* Body */}
      <div className="flex items-start gap-5 transition-all duration-300">
        {/* Sidebar */}
        <AdminSidebar active={open} />

        {/* Main content */}
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

export default memo(AdminLayout);
