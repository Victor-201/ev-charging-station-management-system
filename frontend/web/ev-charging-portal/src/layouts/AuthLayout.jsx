import { memo } from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout min-h-screen flex items-center justify-center bg-red-800">
      <div className="auth-box bg-red-700 shadow-md rounded-xl p-6 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default memo(AuthLayout);
