const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <p className="text-lg mt-3 text-gray-700">
        Trang bạn truy cập không tồn tại.
      </p>
      <a
        href="/login"
        className="mt-5 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Quay về trang đăng nhập
      </a>
    </div>
  );
};

export default NotFound;
