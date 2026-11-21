import api from "./api";

export const getAIEvents = async () => {
    const response = await api.get("/ai-events/");
    return response.data;
};