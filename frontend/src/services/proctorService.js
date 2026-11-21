import api from "./api";

export const getProctorStatus = async () => {
  const response = await api.get("/proctor/status");
  return response.data;
};

export const logProctorViolation = async (
  attemptId,
  violationType
) => {
  const response = await api.post(
    "/proctor/violation",
    {
      attempt_id: attemptId,
      violation_type: violationType,
    }
  );

  return response.data;
};