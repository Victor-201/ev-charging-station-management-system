import { useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";

const initialStations = [
	{ code: "ST-01", name: "Station A", status: "active" },
	{ code: "ST-02", name: "Station B", status: "maintenance" },
	{ code: "ST-03", name: "Station C", status: "offline" },
];

export default function StationManagement() {
	const [rows, setRows] = useState(initialStations);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({ code: "", name: "", status: "active" });
	const [error, setError] = useState("");
	const [deleteRow, setDeleteRow] = useState(null);

	const statuses = useMemo(() => [
		{ value: "active", label: "active" },
		{ value: "maintenance", label: "maintenance" },
		{ value: "offline", label: "offline" },
	], []);

	const onCreate = (e) => {
		e.preventDefault();
		setError("");
		const code = form.code.trim();
		const name = form.name.trim();
		if (!code || !name) {
			setError("Vui lòng nhập đầy đủ Mã trạm và Tên trạm");
			return;
		}
		if (rows.some((r) => r.code.toLowerCase() === code.toLowerCase())) {
			setError("Mã trạm đã tồn tại");
			return;
		}
		setRows((prev) => [...prev, { code, name, status: form.status }]);
		setForm({ code: "", name: "", status: "active" });
		setOpen(false);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Quản lý trạm sạc" subtitle="Danh sách và trạng thái các trạm" />

			<Section
				title="Quản lý trạm sạc"
				actions={
					<button onClick={() => setOpen(true)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">
						Tạo trạm
					</button>
				}
			>
				<Table
					columns={[
						{ key: "code", title: "Mã trạm", dataIndex: "code" },
						{ key: "name", title: "Tên trạm", dataIndex: "name" },
						{ key: "status", title: "Trạng thái", dataIndex: "status" },
						{
							key: "actions",
							title: "Hành động",
							dataIndex: "code",
							render: (_, row) => (
								<div className="flex items-center gap-2">
									<button
										className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
										onClick={() => setDeleteRow(row)}
									>
										Xóa
									</button>
								</div>
							),
						},
					]}
					data={rows}
				/>
			</Section>

			{/* Modal tạo trạm (UI tĩnh, chưa gọi API) */}
			{open && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-3 text-lg font-semibold">Tạo trạm sạc</div>
						{error && (
							<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{error}
							</div>
						)}
						<form onSubmit={onCreate} className="space-y-4">
							<div>
								<label className="text-sm text-gray-700">Mã trạm</label>
								<input
									value={form.code}
									onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder="VD: ST-10"
								/>
							</div>
							<div>
								<label className="text-sm text-gray-700">Tên trạm</label>
								<input
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder="VD: Station X"
								/>
							</div>
							<div>
								<label className="text-sm text-gray-700">Trạng thái</label>
								<select
									value={form.status}
									onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
								>
									{statuses.map((s) => (
										<option key={s.value} value={s.value}>{s.label}</option>
									))}
								</select>
							</div>
							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
								>
									Hủy
								</button>
								<button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-white">
									Tạo
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{deleteRow && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-2 text-lg font-semibold">Xóa trạm</div>
						<p className="mb-4 text-sm text-gray-700">
							Bạn có chắc muốn xóa trạm <span className="font-medium">{deleteRow.name}</span> ({deleteRow.code})?
						</p>
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
								onClick={() => setDeleteRow(null)}
							>
								Hủy
							</button>
							<button
								type="button"
								className="rounded-md bg-red-600 px-4 py-2 text-white"
								onClick={() => {
									setRows((prev) => prev.filter((r) => r.code !== deleteRow.code));
									setDeleteRow(null);
								}}
							>
								Xóa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

