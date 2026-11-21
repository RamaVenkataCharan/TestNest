import api from "./api";


// ==========================================
// ALL AI EVENTS
// ==========================================

export const getAIReports = async () => {

  const response =
    await api.get(
      "/ai-reports/"
    );

  return response.data;
};


// ==========================================
// GLOBAL AI SUMMARY
// ==========================================

export const getAISummary = async () => {

  const response =
    await api.get(
      "/ai-reports/summary"
    );

  return response.data;
};


// ==========================================
// EXAMS FOR REPORTS
// ==========================================

export const getReportExams = async () => {

  const response =
    await api.get(
      "/ai-reports/exams"
    );

  return response.data;
};


// ==========================================
// STUDENTS / ATTEMPTS FOR ONE EXAM
// ==========================================

export const getExamStudentReports =
  async (examId) => {

    const response =
      await api.get(
        `/ai-reports/exam/${examId}/students`
      );

    return response.data;
  };


// ==========================================
// COMPLETE ATTEMPT REPORT JSON
// ==========================================

export const getAttemptReport =
  async (attemptId) => {

    const response =
      await api.get(
        `/ai-reports/attempt/${attemptId}`
      );

    return response.data;
  };


// ==========================================
// DOWNLOAD INDIVIDUAL STUDENT PDF
// ==========================================

export const downloadAttemptReportPDF =
  async (
    attemptId,
    studentName = "student",
    examName = "exam"
  ) => {

    const response =
      await api.get(
        `/ai-reports/attempt/${attemptId}/pdf`,
        {
          responseType: "blob",
        }
      );


    const blob = new Blob(
      [response.data],
      {
        type: "application/pdf",
      }
    );


    const url =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href = url;


    const safeStudent =
      String(studentName)
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );


    const safeExam =
      String(examName)
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );


    link.download =
      `${safeStudent}_${safeExam}_Attempt_${attemptId}.pdf`;


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    window.URL.revokeObjectURL(
      url
    );
  };