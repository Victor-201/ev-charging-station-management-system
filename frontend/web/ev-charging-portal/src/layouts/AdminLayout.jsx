import { memo } from "react";

const AdminLayout = ({ children }) => {
  return (
    <div className="layout-admin min-h-screen flex flex-col">
      <header className="p-4 bg-blue-700 text-white font-semibold">
        Admin Header
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
};

export default memo(AdminLayout);
