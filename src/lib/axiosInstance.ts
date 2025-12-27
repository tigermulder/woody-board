import axios from "axios";
import type { ApiError, ApiErrorResponse } from "@/types/api";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;
    const serverError = data?.error;
    if (serverError?.code && serverError?.message) return serverError;

    if (error.code === "ERR_NETWORK") {
      return {
        code: "NETWORK_ERROR",
        message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "요청 처리 중 오류가 발생했습니다.",
  };
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data?.data;
  },
  (error) => {
    return Promise.reject(normalizeApiError(error));
  }
);
