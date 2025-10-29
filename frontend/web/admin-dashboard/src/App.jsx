import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout.jsx";
import routes from "./routes/index.jsx";

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
