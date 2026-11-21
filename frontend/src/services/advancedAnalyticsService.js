import api from "./api";

export const getAdvancedAnalytics = async () => {
  const response = await api.get("/advanced-analytics/");
  return response.data;
};