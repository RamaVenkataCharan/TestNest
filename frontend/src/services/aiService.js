import api from "./api";

export const getStatus = async () => {
  const response = await api.get("/ai/status");
  return response.data;
};

export const getEvents = async () => {
  const response = await api.get("/ai/events");
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get("/ai/analytics");
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get("/ai/dashboard");
  return response.data;
};