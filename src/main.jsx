import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleMapsProvider } from './context/GoogleMapsContext'; // Import the provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </React.StrictMode>,
)