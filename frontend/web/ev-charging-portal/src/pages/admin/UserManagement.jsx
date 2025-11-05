import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";

const users = [
	{ username: "alice", role: "admin" },
	{ username: "bob", role: "staff" },
	{ username: "charlie", role: "staff" },
];

export default function UserManagement() {
	return (
		<div className="space-y-6">
			<PageHeader title="Quản lý người dùng" subtitle="Danh sách tài khoản và vai trò" />
			<Section title="Quản lý người dùng">
				<Table
					columns={[
						{ key: "username", title: "Tài khoản", dataIndex: "username" },
						{ key: "role", title: "Vai trò", dataIndex: "role" },
					]}
					data={users}
				/>
			</Section>
		</div>
	);
}

