import { useState, useEffect } from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';

export default function LocationAutocomplete({ onSelectAddress, initialValue = '' }) {
  const [address, setAddress] = useState(initialValue);

  useEffect(() => {
    setAddress(initialValue || '');
  }, [initialValue]);

  const handleSelect = (selectedAddress) => {
    setAddress(selectedAddress);
    onSelectAddress(selectedAddress);
  };

  return (
    <PlacesAutocomplete
      value={address}
      onChange={setAddress}
      onSelect={handleSelect}
    >
      {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
        <div className="relative">
          <input
            {...getInputProps({
              placeholder: 'Start typing an address...',
              className: 'mt-1 w-full p-2 border rounded',
            })}
          />
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg mt-1">
            {loading && <div className="p-2 text-gray-500">Loading...</div>}
            {suggestions.map(suggestion => {
              const className = suggestion.active
                ? 'bg-blue-100 cursor-pointer p-2'
                : 'bg-white cursor-pointer p-2';
              return (
                <div
                  {...getSuggestionItemProps(suggestion, {
                    className,
                  })}
                  key={suggestion.placeId}
                >
                  <span>{suggestion.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PlacesAutocomplete>
  );
}