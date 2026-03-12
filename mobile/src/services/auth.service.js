import api from './api';

export const authService = {
  async sendOTP(phone) {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  },

  async verifyOTP(phone, otp, name) {
    const res = await api.post('/auth/verify-otp', { phone, otp, name });
    return res.data; // { token, user }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
};
