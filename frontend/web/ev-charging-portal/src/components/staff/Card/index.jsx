import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="rounded-lg p-3 bg-white shadow-sm">
      {title && (
        <div className="font-bold mb-2 text-gray-800 text-[15px]">
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
