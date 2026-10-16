import axios from "@/lib/axios";
import { LoginInput } from "../schemas/login.schema";
import { RegisterInput } from "../schemas/register.schema";

const AUTH_URL = "/auth";

export const register = async (payload: RegisterInput) => {
  const response = await axios.post(`${AUTH_URL}/register`, payload);
  return response.data;
};

export const login = async (payload: LoginInput) => {
  const response = await axios.post(`${AUTH_URL}/login`, payload);
  return response.data;
};

export const refreshToken = async () => {
  const response = await axios.post(`${AUTH_URL}/refresh-token`);
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${AUTH_URL}/logout`);
  return response.data;
};

export const getMe = async () => {
  const response = await axios.get(`${AUTH_URL}/me`);
  return response.data;
};
