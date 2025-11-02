import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import { setupFetchInterceptor } from './utils/setupApiInterceptors'
import notificationWebSocket from './utils/notificationWebSocket'

// Install global fetch interceptor before app mounts
setupFetchInterceptor()

// Install browser-level hooks (storage/visibility) and attempt initial connect if token exists
try {
  notificationWebSocket._installBrowserHooks && notificationWebSocket._installBrowserHooks();
  if (localStorage.getItem('token')) {
    // give the runtime a tiny delay to ensure React mounts first
    setTimeout(() => notificationWebSocket.connect(), 200);
  }
} catch (err) { console.debug('Error initializing notificationWebSocket:', err); }
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
