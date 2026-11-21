import api from "./api";

export const getPerformance = async () => {
  const response = await api.get("/performance/");
  return response.data;
};

export const getPerformanceSummary = async () => {
  const response = await api.get("/performance/summary");
  return response.data;
};