import Section from "@/components/admin/Section";

const plans = [
	{ name: "Basic", price: "$0", features: ["5 phiên/tháng", "Hỗ trợ email"] },
	{ name: "Pro", price: "$19", features: ["Không giới hạn", "Báo cáo nâng cao"] },
	{ name: "Enterprise", price: "Liên hệ", features: ["SLA", "Tùy chỉnh"] },
];

export default function SubscriptionPlans() {
	return (
		<Section title="Gói đăng ký">
			<div className="grid gap-4 md:grid-cols-3">
				{plans.map((p) => (
					<div key={p.name} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<div className="text-lg font-semibold">{p.name}</div>
						<div className="my-2 text-2xl">{p.price}</div>
						<ul className="mb-3 list-disc pl-5 text-sm text-gray-700">
							{p.features.map((f) => (
								<li key={f}>{f}</li>
							))}
						</ul>
						<button className="w-full rounded-md bg-emerald-600 px-3 py-2 text-white">Chọn</button>
					</div>
				))}
			</div>
		</Section>
	);
}

