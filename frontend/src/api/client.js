import axios from 'axios'
const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/v1', withCredentials: true })
export const messageOf = error => error.response?.data?.message || 'Request failed. Please try again.'
export default client
