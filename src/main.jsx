import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import App from './App';
import './index.css'
import ProfilePage from './ProfilePage'; // Create this in a new 'pages' folder

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleMapsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </GoogleMapsProvider>
  </React.StrictMode>
);
