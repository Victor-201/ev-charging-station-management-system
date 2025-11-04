import { Users, CreditCard, PlugZap } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";

const recent = [
	{ id: "ORD-001", user: "alice", station: "ST-01", amount: "$8.5" },
	{ id: "ORD-002", user: "bob", station: "ST-03", amount: "$12.1" },
	{ id: "ORD-003", user: "eve", station: "ST-02", amount: "$5.6" },
];

export default function Dashboard() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard title="Người dùng" value="1,248" icon={Users} trend="+4.2%" />
				<StatCard title="Thanh toán" value="$7,923" icon={CreditCard} trend="+2.1%" />
				<StatCard title="Phiên sạc" value="324" icon={PlugZap} trend="-1.3%" />
			</div>

			<Section title="Lưu lượng tuần này">
				<Chart height={260} />
			</Section>

					<Section title="Giao dịch gần đây">
						<Table
							columns={[
								{ key: "id", title: "Mã GD", dataIndex: "id" },
								{ key: "user", title: "Người dùng", dataIndex: "user" },
								{ key: "station", title: "Trạm", dataIndex: "station" },
								{ key: "amount", title: "Số tiền", dataIndex: "amount" },
							]}
							data={recent}
						/>
					</Section>
		</div>
	);
}
