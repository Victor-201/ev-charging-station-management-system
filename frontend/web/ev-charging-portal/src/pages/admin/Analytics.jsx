import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import PageHeader from "@/components/admin/PageHeader";

export default function Analytics() {
	return (
		<div className="space-y-6">
			<PageHeader title="Phân tích" subtitle="Biểu đồ và số liệu tổng quan hệ thống" />
			<Section title="Tổng quan phân tích">
				<Chart height={320} />
			</Section>
			<Section title="Hiệu suất theo trạm">
				<Chart height={220} />
			</Section>
		</div>
	);
}

