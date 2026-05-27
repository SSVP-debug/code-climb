import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import AuthProvider from "./context/AuthProvider";
import { AppProvider } from "./context/AppProvider";
import ProgressSync from "./components/ProgressSync";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppProvider>
          <ProgressSync />
          <App />
        </AppProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)