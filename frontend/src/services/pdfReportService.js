import api from "./api";

export const downloadExamPDF = async (attemptId) => {
  const response = await api.get(
    `/reports/exam/${attemptId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = `Exam_Report_${attemptId}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
};