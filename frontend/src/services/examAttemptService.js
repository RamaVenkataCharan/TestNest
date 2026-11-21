import api from "./api";

export const startExam = async (examId) => {
  const response = await api.post("/attempts/start", {
    exam_id: examId,
  });

  return response.data;
};

export const submitExam = async (attemptId, answers) => {
  const response = await api.post("/attempts/submit", {
    attempt_id: attemptId,
    answers,
  });

  return response.data;
};

export const getResult = async (attemptId) => {
  const response = await api.get(`/attempts/result/${attemptId}`);
  return response.data;
};

export const getReview = async (attemptId) => {
    const response = await api.get(`/attempts/review/${attemptId}`);
    return response.data;
  };