import api from "./api";

export const getQuestions = async () => {
  const response = await api.get("/questions/");
  return response.data;
};

export const getQuestionsByExam = async (examId) => {
  const response = await api.get(`/questions/exam/${examId}`);
  return response.data;
};

export const getAdminQuestionsByExam = async (examId) => {
  const response = await api.get(
    `/questions/admin/exam/${examId}`
  );

  return response.data;
};

export const createQuestion = async (questionData) => {
  const response = await api.post("/questions/", questionData);
  return response.data;
};

export const updateQuestion = async (questionId, questionData) => {
  const response = await api.put(
    `/questions/${questionId}`,
    questionData
  );
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(
    `/questions/${questionId}`
  );
  return response.data;
};