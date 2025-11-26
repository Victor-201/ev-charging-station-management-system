import { memo } from "react";

const AuthLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center
      bg-gradient-to-br from-[#BEE3F8] via-[#63B3ED] to-[#3182CE]
      dark:from-[#1A365D] dark:via-[#2A4365] dark:to-[#1E3A8A]
      p-6"
    >
      <div className="w-full max-w-5xl">{children}</div>
    </div>
  );
};

export default memo(AuthLayout);