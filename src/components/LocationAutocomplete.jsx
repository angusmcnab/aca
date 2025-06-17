import { useState, useEffect, useRef } from "react";

// This is the manual, future-proof implementation
export default function LocationAutocomplete({ isLoaded, onSelectAddress }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  
  // We use a ref to hold the service instance to avoid re-creation on every render
  const autocompleteService = useRef(null);

  // Initialize the Autocomplete Service once the script is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Fetch predictions whenever the input value changes
  useEffect(() => {
    if (isLoaded && autocompleteService.current && inputValue) {
      autocompleteService.current.getPlacePredictions(
        { input: inputValue },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      setSuggestions([]);
    }
  }, [inputValue, isLoaded]);


  const handleInput = (e) => {
    setInputValue(e.target.value);
  };

  const handleSelect = (suggestion) => {
    setInputValue(suggestion.description);
    onSelectAddress(suggestion.description);
    setSuggestions([]); // Clear suggestions after selection
  };
  
  // Render a disabled input while the script is loading
  if (!isLoaded) {
    return (
      <input
        className="mt-1 w-full p-2 border rounded bg-gray-100 text-gray-500"
        disabled
        placeholder="Loading map service..."
      />
    );
  }

  return (
    <div className="relative">
      <input
        id="job-location"
        className="mt-1 w-full p-2 border rounded"
        value={inputValue}
        onChange={handleInput}
        placeholder="Start typing an address..."
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg mt-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}