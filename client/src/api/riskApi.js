import axiosInstance from './axios'

export const riskApi = {
  getAll: (params) =>
    axiosInstance.get('/risks', { params }),

  getSummary: () =>
    axiosInstance.get('/risks/summary'),

  getById: (id) =>
    axiosInstance.get(`/risks/${id}`),

  resolve: (id) =>
    axiosInstance.post(`/risks/${id}/resolve`),

  getAnomalies: (params) =>
    axiosInstance.get('/anomalies', { params }),

  getAnomalySummary: () =>
    axiosInstance.get('/anomalies/summary'),
}