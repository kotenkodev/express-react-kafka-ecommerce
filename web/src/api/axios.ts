import axios from "axios";

const instance = axios.create({});

instance.interceptors.request.use(
  (config) => {
    // Add your request interceptor logic here
    const token = "dummy_token"; // Replace with your actual token retrieval logic

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request error here
    return Promise.reject(error);
  },
);

export default instance;
