import React, { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { toast } from 'react-hot-toast';

export default function LocationAutocomplete({ onSelectAddress, initialValue = '' }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const autocompleteRef = useRef(null);

  const handleLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        onSelectAddress(place.formatted_address);
      } else {
        toast.error("Please select a valid address from the list.");
      }
    }
  };
  
  if (loadError) {
    toast.error('Failed to load Google Maps. Please check API key.', { id: 'maps-error' });
    return <input className="mt-1 w-full p-2 border rounded bg-red-100 text-red-700" disabled value="Map service failed" />;
  }

  if (!isLoaded) {
    // Your loading spinner component
    return (
      <div className="mt-1 w-full p-2 border rounded bg-gray-100 text-gray-500 flex items-center">
        {/* SVG spinner */}
        Loading map...
      </div>
    );
  }

  return (
    <Autocomplete
      onLoad={handleLoad}
      onPlaceChanged={handlePlaceChanged}
      options={{ componentRestrictions: { country: 'gb' } }} // Restricts search to Great Britain
    >
      <input
        id="job-location"
        type="text"
        className="mt-1 w-full p-2 border rounded"
        placeholder="Start typing an address..."
        defaultValue={initialValue}
      />
    </Autocomplete>
  );
}