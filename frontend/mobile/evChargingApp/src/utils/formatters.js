// Utility formatters for the app
// export named functions so components can import { formatCurrency }

export function formatCurrency(amount, currency = 'VND') {
	// Handle empty/undefined gracefully
	if (amount === null || amount === undefined || amount === '') return '';

	// Accept numbers or numeric strings
	const num = Number(amount);
	if (Number.isNaN(num)) return String(amount);

	try {
		// For VND we usually don't show fractional digits
		const maximumFractionDigits = currency === 'VND' ? 0 : 2;
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency,
			maximumFractionDigits,
		}).format(num);
	} catch (e) {
		// Fallback: simple thousands separator + currency code
		try {
			return num.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + (currency ? ` ${currency}` : '');
		} catch (err) {
			return String(num);
		}
	}
}

export default { formatCurrency };

