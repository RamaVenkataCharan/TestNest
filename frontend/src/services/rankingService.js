import api from "./api";


// ==========================================
// OVERALL STUDENT RANKING
// ==========================================

export const getRankings =
  async () => {

    const response =
      await api.get(
        "/ranking/"
      );

    return response.data;
  };


// ==========================================
// GET EXAMS FOR LEADERBOARD
// ==========================================

export const getRankingExams =
  async () => {

    const response =
      await api.get(
        "/ranking/exams"
      );

    return response.data;
  };


// ==========================================
// EXAM-WISE RANKING
// ==========================================

export const getExamRankings =
  async (examId) => {

    const response =
      await api.get(
        `/ranking/exam/${examId}`
      );

    return response.data;
  };