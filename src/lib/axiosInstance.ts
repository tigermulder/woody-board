import type { ApiResponse } from "@/types/api";
import axios, { type AxiosResponse } from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    return response.data.data; // data 가공
  },
  (error) => {
    // 서버가 내려주는 공통 에러
    return Promise.reject(error.response?.data?.error);
  }
);
