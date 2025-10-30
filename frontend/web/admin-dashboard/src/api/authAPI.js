import axiosClient from "./axiosClient";

const authAPI = {
  login: (data) => axiosClient.post("/auth/login", data),
  logout: () => localStorage.removeItem("access_token"),
};

export default authAPI;
