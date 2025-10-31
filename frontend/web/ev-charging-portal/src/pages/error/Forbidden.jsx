const Forbidden = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100">
      <h1 className="text-6xl font-bold text-orange-600">403</h1>
      <p className="text-lg mt-3 text-gray-700">
        Bạn không có quyền truy cập trang này.
      </p>
      <a
        href="/login"
        className="mt-5 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
      >
        Quay lại đăng nhập
      </a>
    </div>
  );
};

export default Forbidden;
