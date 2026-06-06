import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/groups': 'https://a85f5v24nb.execute-api.us-east-1.amazonaws.com',
      '/markets': 'https://a85f5v24nb.execute-api.us-east-1.amazonaws.com',
      '/bets': 'https://a85f5v24nb.execute-api.us-east-1.amazonaws.com',
      '/health': 'https://a85f5v24nb.execute-api.us-east-1.amazonaws.com',
    },
  },
})
