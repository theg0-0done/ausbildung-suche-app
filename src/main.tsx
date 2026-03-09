import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import './store/useThemeStore' // initialize theme immediately

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="857174726204-5jq0e9378bkrfdf9hrn631l2nslliqi0.apps.googleusercontent.com">
      <QueryClientProvider client={queryClient}>
          <App />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
