import { useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";

const initialUsers = [
	{ username: "alice", role: "admin" },
	{ username: "bob", role: "staff" },
	{ username: "charlie", role: "staff" },
];

export default function UserManagement() {
	const [rows, setRows] = useState(initialUsers);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({ username: "", role: "staff", password: "" });
	const [error, setError] = useState("");
	const [deleteRow, setDeleteRow] = useState(null);

	const roles = useMemo(() => [
		{ value: "admin", label: "admin" },
		{ value: "staff", label: "staff" },
	], []);

	const onCreate = (e) => {
		e.preventDefault();
		setError("");
		const username = form.username.trim();
		if (!username) {
			setError("Vui lòng nhập tài khoản");
			return;
		}
		if (rows.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
			setError("Tài khoản đã tồn tại");
			return;
		}
		// UI tĩnh: mật khẩu không lưu, chỉ minh họa
		setRows((prev) => [...prev, { username, role: form.role }]);
		setForm({ username: "", role: "staff", password: "" });
		setOpen(false);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Quản lý người dùng" subtitle="Danh sách tài khoản và vai trò" />
			<Section
				title="Quản lý người dùng"
				actions={
					<button onClick={() => setOpen(true)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">
						Tạo người dùng
					</button>
				}
			>
				<Table
					columns={[
						{ key: "username", title: "Tài khoản", dataIndex: "username" },
						{ key: "role", title: "Vai trò", dataIndex: "role" },
						{
							key: "actions",
							title: "Hành động",
							dataIndex: "username",
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

			{/* Modal tạo người dùng (UI tĩnh) */}
			{open && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-3 text-lg font-semibold">Tạo người dùng</div>
						{error && (
							<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{error}
							</div>
						)}
						<form onSubmit={onCreate} className="space-y-4">
							<div>
								<label className="text-sm text-gray-700">Tài khoản</label>
								<input
									value={form.username}
									onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder="VD: minhnguyen"
								/>
							</div>
							<div>
								<label className="text-sm text-gray-700">Mật khẩu</label>
								<input
									type="password"
									value={form.password}
									onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder="••••••••"
								/>
							</div>
							<div>
								<label className="text-sm text-gray-700">Vai trò</label>
								<select
									value={form.role}
									onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
								>
									{roles.map((r) => (
										<option key={r.value} value={r.value}>{r.label}</option>
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
						<div className="mb-2 text-lg font-semibold">Xóa người dùng</div>
						<p className="mb-4 text-sm text-gray-700">
							Bạn có chắc muốn xóa tài khoản <span className="font-medium">{deleteRow.username}</span>?
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
									setRows((prev) => prev.filter((u) => u.username !== deleteRow.username));
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

