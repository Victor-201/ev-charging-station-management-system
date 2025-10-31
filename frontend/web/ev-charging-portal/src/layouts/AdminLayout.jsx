import { memo } from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <header className="p-4 bg-blue-700 text-white">Admin Header</header>
      <main className="p-4">{children}</main>
    </div>
  );
};

export default memo(AdminLayout);
