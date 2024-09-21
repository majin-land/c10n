import { create } from 'apisauce'

const ENDPOINT_URL = `/api`

// define the base URL
const api = create({
  baseURL: ENDPOINT_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export const setApiAuth = (token: string) => api.setHeader('Authorization', token)

export default api
