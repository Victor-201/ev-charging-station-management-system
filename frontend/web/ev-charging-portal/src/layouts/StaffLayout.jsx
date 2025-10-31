import { memo } from 'react';

const StaffLayout = ({ children }) => {
  return (
    <div className="staff-layout">
      <header className="p-4 bg-green-700 text-white">Staff Header</header>
      <main className="p-4">{children}</main>
    </div>
  );
};

export default memo(StaffLayout);
