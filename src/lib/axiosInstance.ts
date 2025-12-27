import axios from "axios";

export const apiClient = axios.create({
	baseURL: "http://localhost:4000/api",
	headers: {
		"Content-Type": "application/json",
	},
});

apiClient.interceptors.response.use(
	(response) => response.data.data,
	(error) => Promise.reject(error.response?.data?.error),
);
