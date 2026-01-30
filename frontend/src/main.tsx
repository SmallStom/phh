import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { initTheme } from './store/themeStore'

// 初始化主题
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 2000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 3000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </>
)
