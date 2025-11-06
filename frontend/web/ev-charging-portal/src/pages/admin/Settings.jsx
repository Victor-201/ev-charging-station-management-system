import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

export default function Settings() {
	return (
		<div className="space-y-6">
			<PageHeader title="Cài đặt" subtitle="Cấu hình chung cho hệ thống" />
			<Section title="Cấu hình chung">
				<form className="space-y-4 max-w-xl">
					<div>
						<label className="text-sm">Tên hệ thống</label>
						<input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-700" placeholder="EV Charging" />
					</div>
					<div>
						<label className="text-sm">Đơn vị tiền tệ</label>
						<select className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-700">
							<option>USD</option>
							<option>VND</option>
						</select>
					</div>
					<button type="button" className="rounded-md bg-emerald-600 px-4 py-2 text-white">Lưu</button>
				</form>
			</Section>
		</div>
	);
}

