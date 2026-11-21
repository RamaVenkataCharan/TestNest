import api from "./api";
import { jwtDecode } from "jwt-decode";

export const login = async ({ username, password }) => {
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post(
    "/users/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const token = response.data.access_token;

  localStorage.setItem("token", token);

  const decoded = jwtDecode(token);

  localStorage.setItem("role", decoded.role);
  localStorage.setItem("user_email", decoded.sub);
  localStorage.setItem("user_id", decoded.id);

  return decoded;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_id");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getRole = () => {
  return localStorage.getItem("role");
};