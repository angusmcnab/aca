import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext();
const libraries = ['places'];

export const GoogleMapsProvider = ({ children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY, // Make sure your .env is set up
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);