import axios from "@/lib/axios";
import { LoginInput } from "../schemas/login.schema";
import { RegisterInput } from "../schemas/register.schema";
import { User } from "../types";

const AUTH_URL = "/auth";

export const register = async (payload: RegisterInput): Promise<User> => {
  const response = await axios.post(`${AUTH_URL}/register`, payload);
  return response.data;
};

export const login = async (
  payload: LoginInput,
): Promise<{ user: User; accessToken: string }> => {
  const response = await axios.post(`${AUTH_URL}/login`, payload);
  return response.data;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await axios.post(`${AUTH_URL}/refresh`);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const response = await axios.post(`${AUTH_URL}/logout`);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await axios.get(`${AUTH_URL}/me`);
  return response.data;
};
