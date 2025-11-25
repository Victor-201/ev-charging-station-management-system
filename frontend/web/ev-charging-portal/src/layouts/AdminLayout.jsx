import UnifiedLayout from "./UnifiedLayout";

export default function AdminLayout({ children }) {
  return <UnifiedLayout mode="admin">{children}</UnifiedLayout>;
}
