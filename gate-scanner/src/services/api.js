import axios from 'axios';
import { API_BASE } from '../utils/constants';

const api = axios.create({ baseURL: API_BASE, timeout: 8000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('gate_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gate_token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;

export const authService = {
  async sendOTP(phone) {
    const r = await api.post('/auth/send-otp', { phone });
    return r.data;
  },
  async verifyOTP(phone, otp) {
    const r = await api.post('/auth/verify-otp', { phone, otp });
    return r.data;
  },
};

export const gateService = {
  async scanQR(qrCode) {
    const r = await api.post('/gate/scan', { qrCode });
    return r.data;
  },
  async getLogs(limit = 30) {
    const r = await api.get(`/gate/logs?limit=${limit}`);
    return r.data.logs || [];
  },
};
