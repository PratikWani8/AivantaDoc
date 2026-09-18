import axiosInstance from './axios'

export const documentApi = {
 upload: (formData, onUploadProgress) =>
  axiosInstance.post('/documents/upload', formData, {
    onUploadProgress,
  }),

  getAll: (params) =>
    axiosInstance.get('/documents', { params }),

  getById: (id) =>
    axiosInstance.get(`/documents/${id}`),

  getStatus: (id) =>
    axiosInstance.get(`/documents/${id}/status`),

  delete: (id) =>
    axiosInstance.delete(`/documents/${id}`),

  export: (id) =>
    axiosInstance.get(`/documents/${id}/export`, {
      responseType: 'blob',
    }),

  verify: (id) =>
    axiosInstance.post(`/documents/${id}/verify`),

  approve: (id) =>
    axiosInstance.post(`/documents/${id}/approve`),

  reject: (id, reason) =>
    axiosInstance.post(`/documents/${id}/reject`, { reason }),
}