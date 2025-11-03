import React, { useState } from "react";
import Sidebar from "../components/staff/Sidebar";
import Navbar from "../components/staff/navbar";
import Modal from "../components/staff/Modal";

export default function StaffLayout({ children }) {
  const [open, setOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* ================= NAVBAR ================= */}
      <Navbar onToggle={() => setOpen((v) => !v)} />

      {/* ================= BODY ================= */}
      <div className="flex items-start gap-5 transition-all duration-300">
        {/* Sidebar */}
        <Sidebar active={open} />

        {/* Main content */}
        <main className="flex-1 px-6 py-6 transition-all duration-300 max-[900px]:px-4">
          <div className="max-w-[1100px] mx-auto">
            {/* ===== Render nội dung của từng trang con ===== */}
            <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_rgba(8,12,20,0.06)]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL ================= */}
      <Modal
        open={showModal}
        title="Create reservation"
        onClose={() => setShowModal(false)}
      >
        <div className="text-[15px] text-gray-600">
          Demo modal content — replace this with your form or custom content.
        </div>
      </Modal>
    </div>
  );
}
