import { BrowserRouter } from "react-router-dom";
// import { AuthProvider } from "@/providers/AuthProvider";
import { AuthProvider } from "@/providers/AuthProvider.fake.jsx";
import AppRouter from "@/routes/AppRouter";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
