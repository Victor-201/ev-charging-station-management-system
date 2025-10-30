export const currency = (v, locale = "vi-VN", currency = "VND") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(v ?? 0);

export const dateTime = (v) =>
  v ? new Date(v).toLocaleString("vi-VN") : "-";
