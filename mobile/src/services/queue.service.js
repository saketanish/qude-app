import api from './api';

export const queueService = {
  async getQueue(queueId) {
    const res = await api.get(`/queues/${queueId}`);
    return res.data.queue;
  },

  async getQueueStatus(queueId) {
    const res = await api.get(`/queues/${queueId}/status`);
    return res.data;
  },

  async joinQueue(queueId) {
    const res = await api.post(`/queues/${queueId}/join`);
    return res.data;
  },

  async getMyToken(queueId) {
    const res = await api.get(`/queues/${queueId}/my-token`);
    return res.data;
  },

  async leaveQueue(queueId) {
    const res = await api.delete(`/queues/${queueId}/leave`);
    return res.data;
  },

  async getMyTokens() {
    const res = await api.get('/tokens/my-history');
    return res.data.tokens || [];
  },
};
