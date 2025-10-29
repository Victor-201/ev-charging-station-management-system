import { useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const title = location.pathname.replace("/", "") || "overview";
  const formattedTitle = title
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-white/40">
      <div>
        <h1 className="text-2xl font-semibold text-ev-gunmetal">Admin - {formattedTitle}</h1>
        <p className="text-sm text-ev-deep/70">Quản trị hệ thống trạm sạc EV</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 text-sm font-medium rounded-xl bg-ev-teal text-white hover:bg-ev-deep transition-colors">
          Tạo báo cáo
        </button>
        <div className="h-10 w-10 rounded-full bg-ev-teal/10 flex items-center justify-center text-ev-teal font-semibold">
          TT
        </div>
      </div>
    </header>
  );
}

export default Navbar;
