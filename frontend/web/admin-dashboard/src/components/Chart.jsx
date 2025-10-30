function Chart({ title = "Chart", children }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2 text-ev-gunmetal">{title}</h3>
      {children || <div className="text-ev-gunmetal/60">Biểu đồ sẽ hiển thị ở đây.</div>}
    </div>
  );
}

export default Chart;
