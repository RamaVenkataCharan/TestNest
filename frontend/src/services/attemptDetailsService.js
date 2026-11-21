import api from "./api";

export const getAttemptDetails = async (attemptId) => {
  const response = await api.get(
    `/attempt-details/${attemptId}`
  );

  return response.data;
};