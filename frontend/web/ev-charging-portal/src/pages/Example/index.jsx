import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { userService } from "@/services/userService";

const ExamplePage = () => {
  const api = useApi();
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await userService.getAll({ page: 1, limit: 10 });
      setUsers(res.data || res);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">User List (Example API Page)</h1>

      <button
        onClick={fetchUsers}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded mb-4"
        disabled={api.loading}
      >
        {api.loading ? "Loading..." : "Reload"}
      </button>

      {api.loading && users.length === 0 ? (
        <div>Loading data...</div>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">ID</th>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {users?.length ? (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="border px-3 py-2">{u.id}</td>
                  <td className="border px-3 py-2">{u.name}</td>
                  <td className="border px-3 py-2">{u.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center p-4 text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExamplePage;
