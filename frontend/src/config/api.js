// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 30000, // 30 seconds for video processing
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://audio-subtitler-version2-0.onrender.com',
    timeout: 60000, // 60 seconds for production
  }
}

// Get current environment
const isDevelopment = import.meta.env.DEV
const config = API_CONFIG[isDevelopment ? 'development' : 'production']

export const API_BASE_URL = config.baseURL
export const API_TIMEOUT = config.timeout

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

// Common API endpoints
export const ENDPOINTS = {
  PIPELINE_PROCESS: '/pipeline/process',
  OVERLAY_OVERLAY: '/overlay/overlay',
  HEALTH: '/health',
}

export default config
