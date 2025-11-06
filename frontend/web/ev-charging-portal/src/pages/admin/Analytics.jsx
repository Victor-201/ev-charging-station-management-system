import { useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import PageHeader from "@/components/admin/PageHeader";

export default function Analytics() {
	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
	const [from, setFrom] = useState(today);
	const [to, setTo] = useState(today);
	const [key, setKey] = useState(0); // đổi key để force re-render chart (UI tĩnh)

	return (
		<div className="space-y-6">
			<PageHeader title="Phân tích" subtitle="Biểu đồ và số liệu tổng quan hệ thống" />

			<Section
				title="Tổng quan phân tích"
				actions={
					<div className="flex items-center gap-3">
						<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-3 py-1.5" />
						<span className="text-sm text-gray-600">đến</span>
						<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-3 py-1.5" />
						<button onClick={() => setKey((k) => k + 1)} className="rounded-md bg-blue-600 px-3 py-1.5 text-white">Áp dụng</button>
					</div>
				}
			>
				<div className="mb-3 text-sm text-gray-600">Khoảng thời gian: {from} → {to}</div>
				<Chart key={`overview-${key}`} height={320} />
			</Section>

			<Section title="Hiệu suất theo trạm">
				<Chart key={`station-${key}`} height={220} />
			</Section>
		</div>
	);
}

