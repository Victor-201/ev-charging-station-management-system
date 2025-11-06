import { Users, CreditCard, PlugZap, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/admin/StatCard";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import { ROUTERS } from "@/utils/constants";

const recent = [
	{ id: "ORD-001", user: "alice", station: "ST-01", amount: "$8.5" },
	{ id: "ORD-002", user: "bob", station: "ST-03", amount: "$12.1" },
	{ id: "ORD-003", user: "eve", station: "ST-02", amount: "$5.6" },
];

export default function Dashboard() {
	const navigate = useNavigate();

	const quickCards = [
		{ key: "users", title: "Users", subtitle: "Quản lý người dùng", icon: Users, route: ROUTERS.ADMIN.USER_MANAGEMENT },
		{ key: "stations", title: "Stations", subtitle: "Quản lý trạm sạc", icon: PlugZap, route: ROUTERS.ADMIN.STATION_MANAGEMENT },
		{ key: "reports", title: "Reports", subtitle: "Báo cáo & số liệu", icon: CreditCard, route: ROUTERS.ADMIN.REPORTS },
		{ key: "settings", title: "Settings", subtitle: "Cấu hình hệ thống", icon: Settings, route: ROUTERS.ADMIN.SETTINGS },
	];

	return (
		<div className="space-y-6">
			{/* Hero banner (reference style from staff dashboard) */}
			<div className="mx-auto w-full max-w-[980px]">
				<div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-2xl">
					<div className="flex items-center gap-6 px-6 py-6">
						<div className="h-[120px] w-[120px] rounded-xl border-2 border-dashed border-white/20 bg-white/10 flex items-center justify-center">
							{/* Simple camera-like emoji as a visual focal point */}
							<div className="text-5xl">📊</div>
						</div>
						<div className="flex-1">
							<div className="text-2xl font-extrabold mb-1">Bảng điều khiển Admin</div>
							<div className="opacity-90">Tổng quan và truy cập nhanh các khu vực quản trị</div>
						</div>
					</div>
				</div>
			</div>

			{/* Quick actions 2x2 grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{quickCards.map((c) => (
					<button
						key={c.key}
						onClick={() => navigate(c.route)}
						className="group flex min-h-[120px] items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
					>
						<div className="flex items-center gap-4">
							<div className="flex h-[64px] w-[64px] items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
								<c.icon size={28} />
							</div>
							<div>
								<div className="text-base font-extrabold">{c.title}</div>
								<div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{c.subtitle}</div>
							</div>
						</div>
						<div className="text-xl font-bold text-blue-600 transition-transform group-hover:translate-x-1">→</div>
					</button>
				))}
			</div>

			{/* KPI stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard title="Người dùng" value="1,248" icon={Users} trend="+4.2%" />
				<StatCard title="Thanh toán" value="$7,923" icon={CreditCard} trend="+2.1%" />
				<StatCard title="Phiên sạc" value="324" icon={PlugZap} trend="-1.3%" />
			</div>

			<Section title="Lưu lượng tuần này">
				<Chart height={260} />
			</Section>

			<Section title="Hoạt động gần đây">
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
