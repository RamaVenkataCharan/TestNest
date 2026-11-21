import api from "./api";

export const downloadAIReport = async () => {
  const response = await api.get("/export/ai-events", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));

  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "ai_events_report.csv");

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
};