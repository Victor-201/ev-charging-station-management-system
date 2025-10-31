import { memo } from "react";

const StaffLayout = ({ children }) => {
  return (
    <div className="layout-staff min-h-screen flex flex-col">
      <header className="p-4 bg-green-700 text-white font-semibold">
        Staff Header
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
};

export default memo(StaffLayout);
