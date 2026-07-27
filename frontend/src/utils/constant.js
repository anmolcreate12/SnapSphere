// Central place for all backend URLs.
// Locally this reads from frontend/.env (VITE_API_URL=http://localhost:5000/api/v1)
// In production, set VITE_API_URL on your hosting platform's env settings
// to your deployed backend's URL, e.g. https://your-backend.onrender.com/api/v1

export const BASE_URL = import.meta.env.VITE_API_URL;

// SocketContext connects to the raw server (no /api/v1), so we derive it
// by stripping the /api/v1 suffix from BASE_URL.
export const SOCKET_URL = BASE_URL.replace(/\/api\/v1$/, "");

export const USER_API_END_POINT = `${BASE_URL}/user`;
export const POST_API_END_POINT = `${BASE_URL}/post`;
export const MESSAGE_API_END_POINT = `${BASE_URL}/message`;
export const CALL_API_END_POINT = `${BASE_URL}/call`;
export const NOTIFICATION_API_END_POINT = `${BASE_URL}/notification`;
