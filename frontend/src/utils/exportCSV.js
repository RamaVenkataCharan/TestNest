import { saveAs } from "file-saver";

export const exportAnalyticsCSV = (data) => {
  const headers = [
    "Attempt ID",
    "Student",
    "Exam",
    "Total Events",
    "Total Points",
    "Risk Level",
  ];

  const rows = data.map((item) => [
    item.attempt_id,
    item.student_name,
    item.exam_title,
    item.total_events,
    item.total_points,
    item.risk_level,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  saveAs(blob, "analytics_report.csv");
};