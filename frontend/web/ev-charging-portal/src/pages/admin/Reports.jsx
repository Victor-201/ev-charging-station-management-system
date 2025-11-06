import { useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

export default function Reports() {
	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
	const [from, setFrom] = useState(today);
	const [to, setTo] = useState(today);

	const exportCSV = () => {
		const csv = [
			"date,sessions,revenue",
			`${from},120,15200000`,
			`${to},98,12100000`,
		].join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `report_${from}_to_${to}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Báo cáo" subtitle="Xuất và theo dõi các loại báo cáo hệ thống" />

			<Section
				title="Báo cáo doanh thu"
				actions={
					<div className="flex items-center gap-3">
						<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-3 py-1.5" />
						<span className="text-sm text-gray-600">đến</span>
						<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-3 py-1.5" />
						<button onClick={exportCSV} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">Xuất CSV</button>
					</div>
				}
			>
				<p className="text-sm text-gray-600">Chọn khoảng thời gian rồi xuất báo cáo để phân tích thêm.</p>
			</Section>

			<Section title="Báo cáo hoạt động">
				<ul className="list-disc pl-6 text-sm text-gray-700">
					<li>Phiên sạc theo ngày</li>
					<li>Thời gian sử dụng trạm</li>
					<li>Top trạm theo doanh thu</li>
				</ul>
			</Section>
		</div>
	);
}

