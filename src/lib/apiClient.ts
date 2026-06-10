import axios from 'axios'
import { parseApiError } from './apiError'
import { ErrorCode } from '@/modules/iam/models/auth.model'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const parsed = parseApiError(error)
    if (parsed.status === 401 && parsed.errorCode === ErrorCode.UNAUTHORIZED) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

export default http
