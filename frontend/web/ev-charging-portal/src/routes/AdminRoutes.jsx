import { memo } from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/common/Sidebar/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="layout-admin">
      <Header role="admin" />
      <div className="layout-body flex">
        <Sidebar role="admin" />
        <main className="layout-content flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};

export default memo(AdminLayout);
