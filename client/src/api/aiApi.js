import axiosInstance from './axios'

export const aiApi = {
  query: (data) =>
    axiosInstance.post('/ai/query', data),

  getTransactions: (params) =>
    axiosInstance.get('/ai/transactions', { params }),

  getTransactionById: (id) =>
    axiosInstance.get(`/ai/transactions/${id}`),
}
