import axiosInstance from './axios'

export const authApi = {
  login: (data) =>
    axiosInstance.post('/auth/login', data),

  register: (data) =>
    axiosInstance.post('/auth/register', data),

  logout: () =>
    axiosInstance.post('/auth/logout'),

 getProfile: () => axiosInstance.get('/auth/me'),

  updateProfile: (data) =>
    axiosInstance.put('/auth/profile', data),

  changePassword: (data) =>
    axiosInstance.put('/auth/change-password', data),
}