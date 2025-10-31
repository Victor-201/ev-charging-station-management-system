import { memo } from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/common/Sidebar/Sidebar';

const StaffLayout = ({ children }) => {
  return (
    <div className="layout-staff">
      <Header role="staff" />
      <div className="layout-body flex">
        <Sidebar role="staff" />
        <main className="layout-content flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};

export default memo(StaffLayout);
