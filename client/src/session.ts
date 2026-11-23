import axios from "axios";

const origin = "http://localhost:5000";

axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token && config.url?.startsWith(origin + "/api/")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

axios.interceptors.response.use(undefined, error => {
  const config = error.config;
  if (error.response?.status === 401 && config?.url?.startsWith(origin + "/api/") &&
      config.url !== origin + "/api/session" &&
      config.headers?.get("Authorization") === `Bearer ${localStorage.getItem("token")}`) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/");
  }
  return Promise.reject(error);
});

export async function signOut() {
  try {
    await axios.delete(origin + "/api/session", { timeout: 3000 });
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}
