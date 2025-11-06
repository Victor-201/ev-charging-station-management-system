import { useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

const initialPlans = [
	{ name: "Basic", price: "0", features: ["5 phiên/tháng", "Hỗ trợ email"] },
	{ name: "Pro", price: "19", features: ["Không giới hạn", "Báo cáo nâng cao"] },
	{ name: "Enterprise", price: "Liên hệ", features: ["SLA", "Tùy chỉnh"] },
];

export default function SubscriptionPlans() {
	const [plans, setPlans] = useState(initialPlans);
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({ name: "", price: "0", featuresText: "" });
	const [selectOpen, setSelectOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [planToDelete, setPlanToDelete] = useState(null);

	const onCreate = (e) => {
		e.preventDefault();
		setError("");
		const name = form.name.trim();
		if (!name) {
			setError("Vui lòng nhập tên gói");
			return;
		}
		if (plans.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
			setError("Tên gói đã tồn tại");
			return;
		}
		const features = form.featuresText
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);
		setPlans((prev) => [...prev, { name, price: form.price, features }]);
		setForm({ name: "", price: "0", featuresText: "" });
		setOpen(false);
	};

	const handleSelect = (plan) => {
		setSelectedPlan(plan);
		setSelectOpen(true);
	};

	const confirmSelect = () => {
		if (!selectedPlan) return;
		if (selectedPlan.price === "Liên hệ") {
			alert(`Đã ghi nhận yêu cầu liên hệ cho gói ${selectedPlan.name}. Chúng tôi sẽ sớm liên hệ!`);
		} else {
			alert(`Bạn đã chọn gói ${selectedPlan.name} với giá ${selectedPlan.price === "Liên hệ" ? selectedPlan.price : `$${selectedPlan.price}`}`);
		}
		setSelectOpen(false);
		setSelectedPlan(null);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Gói đăng ký" subtitle="Quản lý các gói và quyền lợi" />
			<Section
				title="Gói đăng ký"
				actions={
					<button onClick={() => setOpen(true)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">
						Tạo gói
					</button>
				}
			>
				<div className="grid gap-4 md:grid-cols-3">
					{plans.map((p) => (
						<div key={p.name} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
							<div className="text-lg font-semibold">{p.name}</div>
							<div className="my-2 text-2xl">
								{p.price === "Liên hệ" ? p.price : `$${p.price}`}
							</div>
							<ul className="mb-3 list-disc pl-5 text-sm text-gray-700">
								{p.features.map((f) => (
									<li key={f}>{f}</li>
								))}
							</ul>
							<div className="flex gap-2">
								<button onClick={() => handleSelect(p)} className="w-full rounded-md bg-emerald-600 px-3 py-2 text-white">Chọn</button>
								<button
									type="button"
									onClick={() => { setPlanToDelete(p); setDeleteOpen(true); }}
									className="rounded-md border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50"
								>
									Xóa
								</button>
							</div>
						</div>
					))}
				</div>
			</Section>

			{open && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-3 text-lg font-semibold">Tạo gói đăng ký</div>
						{error && (
							<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{error}
							</div>
						)}
						<form onSubmit={onCreate} className="space-y-4">
							<div>
								<label className="text-sm text-gray-700">Tên gói</label>
								<input
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder="VD: Starter"
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm text-gray-700">Giá (USD)</label>
									<input
										type="number"
										min="0"
										value={form.price}
										onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
										className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									/>
								</div>
								<div>
									<label className="text-sm text-gray-700">Hoặc ghi "Liên hệ"</label>
									<button
										type="button"
										onClick={() => setForm((f) => ({ ...f, price: "Liên hệ" }))}
										className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-left"
									>
										Đặt là "Liên hệ"
									</button>
								</div>
							</div>
							<div>
								<label className="text-sm text-gray-700">Quyền lợi (mỗi dòng 1 mục)</label>
								<textarea
									rows={4}
									value={form.featuresText}
									onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
									className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
									placeholder={"Ví dụ:\nKhông giới hạn\nHỗ trợ 24/7"}
								/>
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
									Tạo gói
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{selectOpen && selectedPlan && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-2 text-lg font-semibold">Xác nhận chọn gói</div>
						<div className="mb-4 text-sm text-gray-700">
							Bạn đang chọn gói <span className="font-medium">{selectedPlan.name}</span>
							{selectedPlan.price === "Liên hệ" ? (
								<>
									{" "}(Liên hệ để biết giá). Chúng tôi sẽ liên hệ để tư vấn chi tiết.
								</>
							) : (
								<>
									{" "}với giá <span className="font-mono">${selectedPlan.price}</span>/tháng.
								</>
							)}
						</div>
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setSelectOpen(false);
									setSelectedPlan(null);
								}}
								className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
							>
								Hủy
							</button>
							<button type="button" onClick={confirmSelect} className="rounded-md bg-emerald-600 px-4 py-2 text-white">
								Xác nhận
							</button>
						</div>
					</div>
				</div>
			)}

			{deleteOpen && planToDelete && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-2 text-lg font-semibold">Xóa gói</div>
						<p className="mb-4 text-sm text-gray-700">
							Bạn có chắc muốn xóa gói <span className="font-medium">{planToDelete.name}</span>?
						</p>
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
								onClick={() => { setDeleteOpen(false); setPlanToDelete(null); }}
							>
								Hủy
							</button>
							<button
								type="button"
								className="rounded-md bg-red-600 px-4 py-2 text-white"
								onClick={() => {
									setPlans((prev) => prev.filter((x) => x.name !== planToDelete.name));
									setDeleteOpen(false);
									setPlanToDelete(null);
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

