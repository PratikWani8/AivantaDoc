import axiosInstance from './axios'

export const vendorApi = {
  getAll:   (params) => axiosInstance.get('/vendors', { params }),
  getById:  (id)     => axiosInstance.get(`/vendors/${id}`),
  getStats: (id)     => axiosInstance.get(`/vendors/${id}/stats`),
}
