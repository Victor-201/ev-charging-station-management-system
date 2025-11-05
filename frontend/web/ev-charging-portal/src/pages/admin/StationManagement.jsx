import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";

const stations = [
	{ code: "ST-01", name: "Station A", status: "active" },
	{ code: "ST-02", name: "Station B", status: "maintenance" },
	{ code: "ST-03", name: "Station C", status: "offline" },
];

export default function StationManagement() {
	return (
		<div className="space-y-6">
			<PageHeader title="Quản lý trạm sạc" subtitle="Danh sách và trạng thái các trạm" />
			<Section
				title="Quản lý trạm sạc"
				actions={<button className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">Tạo trạm</button>}
			>
				<Table
					columns={[
						{ key: "code", title: "Mã trạm", dataIndex: "code" },
						{ key: "name", title: "Tên trạm", dataIndex: "name" },
						{ key: "status", title: "Trạng thái", dataIndex: "status" },
					]}
					data={stations}
				/>
			</Section>
		</div>
	);
}

