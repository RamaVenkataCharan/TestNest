import api from "./api";

export const getStudentPerformance = async () => {
  const response = await api.get("/student-performance/");
  return response.data;
};