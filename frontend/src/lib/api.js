import axios from 'axios'
const baseURL = process.env.VITE_WS_URL
const api = axios.create({baseURL})

export default api