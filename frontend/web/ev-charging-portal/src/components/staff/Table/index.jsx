import React from "react";

export default function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-[#f9fafb] text-gray-800 font-semibold">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 border-b border-gray-100">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2 border-b border-gray-100">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
