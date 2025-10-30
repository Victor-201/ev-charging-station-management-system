import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

function AdminLayout() {
  return (
    <div className="flex bg-ev-black min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gradient-to-br from-ev-deep/10 via-ev-ice/20 to-white px-8 py-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <Navbar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
