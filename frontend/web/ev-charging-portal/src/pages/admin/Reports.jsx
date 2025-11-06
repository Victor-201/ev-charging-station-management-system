import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

export default function Reports() {
	return (
		<div className="space-y-6">
			<PageHeader title="Báo cáo" subtitle="Xuất và theo dõi các loại báo cáo hệ thống" />
			<Section
				title="Báo cáo doanh thu"
				actions={<button className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">Xuất CSV</button>}
			>
				<p className="text-sm text-gray-600">Chọn tham số và xuất báo cáo để phân tích thêm.</p>
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

