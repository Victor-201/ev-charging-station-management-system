import { useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

export default function Settings() {
	const [systemName, setSystemName] = useState("EV Charging");
	const [currency, setCurrency] = useState("VND");
	const [emailNotif, setEmailNotif] = useState(true);
	const [smsNotif, setSmsNotif] = useState(false);
	const [theme, setTheme] = useState("light");
	const [apiKey] = useState("sk_live_****************");

	const saveGeneral = () => {
		// Static UI: just show a quick confirmation
		alert("Đã lưu cấu hình chung");
	};

	const saveNotifications = () => {
		alert("Đã lưu cài đặt thông báo");
	};

	const saveAppearance = () => {
		alert("Đã lưu giao diện");
	};

	const copyKey = () => {
		navigator.clipboard.writeText(apiKey);
		alert("Đã copy API Key");
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Cài đặt" subtitle="Cấu hình chung cho hệ thống" />

			<Section title="Cấu hình chung">
				<form className="space-y-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
					<div>
						<label className="text-sm">Tên hệ thống</label>
						<input
							className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-700"
							value={systemName}
							onChange={(e) => setSystemName(e.target.value)}
							placeholder="EV Charging"
						/>
					</div>
					<div>
						<label className="text-sm">Đơn vị tiền tệ</label>
						<select
							className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-700"
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
						>
							<option>USD</option>
							<option>VND</option>
						</select>
					</div>
					<button type="button" onClick={saveGeneral} className="rounded-md bg-emerald-600 px-4 py-2 text-white">Lưu</button>
				</form>
			</Section>

			<Section title="Thông báo">
				<div className="max-w-xl space-y-4">
					<label className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
						<span>Email</span>
						<input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
					</label>
					<label className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
						<span>SMS</span>
						<input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} />
					</label>
					<button type="button" onClick={saveNotifications} className="rounded-md bg-emerald-600 px-4 py-2 text-white">Lưu</button>
				</div>
			</Section>

			<Section title="Giao diện">
				<div className="max-w-xl space-y-4">
					<div>
						<label className="text-sm">Chế độ</label>
						<select
							className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-700"
							value={theme}
							onChange={(e) => setTheme(e.target.value)}
						>
							<option value="light">Sáng</option>
							<option value="dark">Tối</option>
							<option value="auto">Tự động</option>
						</select>
					</div>
					<button type="button" onClick={saveAppearance} className="rounded-md bg-emerald-600 px-4 py-2 text-white">Lưu</button>
				</div>
			</Section>

			<Section title="API Keys">
				<div className="max-w-xl space-y-2">
					<div className="flex items-center justify-between rounded border border-gray-200 p-3 font-mono text-sm dark:border-gray-700">
						<span>{apiKey}</span>
						<button type="button" onClick={copyKey} className="rounded-md bg-gray-900 px-3 py-1.5 text-white dark:bg-gray-700">Copy</button>
					</div>
					<p className="text-xs text-gray-500">Giữ bí mật API key. Có thể thu hồi và tạo mới trong tương lai.</p>
				</div>
			</Section>
		</div>
	);
}

