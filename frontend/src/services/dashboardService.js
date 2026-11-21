import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getRecentAttempts = async () => {
  const response = await api.get("/dashboard/recent-attempts");
  return response.data;
};