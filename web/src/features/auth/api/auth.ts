export const getUserProfile = async (userId) => {
  const response = await apiClient.get(ENDPOINTS.USER_PROFILE(userId));
  return response.data;
};
