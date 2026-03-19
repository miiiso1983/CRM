import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { debounce } from '../../utils/helpers';

export default function SearchBar({ onSearch, placeholder = 'البحث...', className = '' }) {
  const [value, setValue] = useState('');

  const debouncedSearch = useCallback(
    debounce((val) => onSearch(val), 400),
    [onSearch]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    debouncedSearch(val);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field pr-9 pl-8"
      />
      {value && (
        <button onClick={handleClear} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

