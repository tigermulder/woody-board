import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverError = error.response?.data?.error;
    return Promise.reject(
      serverError || { message: "네트워크 오류가 발생했습니다." }
    );
  }
);
