import axios from "axios";

const axiosWrapper = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: false,
});

axiosWrapper.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosWrapper.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "401 Unauthorized â€” token sent but rejected by backend"
      );
      localStorage.clear();
      window.location.href= "/";
    }
    return Promise.reject(error);
  }
);

export default axiosWrapper;
