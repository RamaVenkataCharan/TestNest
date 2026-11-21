let socket = null;

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const WS_URL = API_URL.replace(/^http/, "ws");


export const connectWebSocket = (onMessage) => {
  socket = new WebSocket(
    `${WS_URL}/ws/proctor`
  );

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (onMessage) {
        onMessage(data);
      }
    } catch (error) {
      console.error(
        "WebSocket message error:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "WebSocket error:",
      error
    );
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return socket;
};


export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};


export const getWebSocket = () => {
  return socket;
};