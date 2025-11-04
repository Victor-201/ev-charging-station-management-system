import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";

const users = [
	{ username: "alice", role: "admin" },
	{ username: "bob", role: "staff" },
	{ username: "charlie", role: "staff" },
];

export default function UserManagement() {
	return (
		<Section title="Quản lý người dùng">
			<Table
				columns={[
					{ key: "username", title: "Tài khoản", dataIndex: "username" },
					{ key: "role", title: "Vai trò", dataIndex: "role" },
				]}
				data={users}
			/>
		</Section>
	);
}

