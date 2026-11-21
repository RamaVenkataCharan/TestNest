import api from "./api";

export const getAIStatus = async () => {
  const response = await api.get("/ai/dashboard");
  return response.data;
};