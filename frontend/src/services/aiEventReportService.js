import api from "./api";

export const downloadAIEventPDF = async (attemptId) => {
  const response = await api.get(
    `/ai-event-report/${attemptId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data], {
      type: "application/pdf",
    })
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = `AI_Report_Attempt_${attemptId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};