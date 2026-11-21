import api from "./api";

export const getStudentHistory = async () => {
  const response = await api.get("/student-history/");
  return response.data;
};