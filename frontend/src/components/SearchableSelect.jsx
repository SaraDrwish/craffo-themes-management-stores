import { useState, useEffect, useRef } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = "اختر..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // تصفية الخيارات بناءً على البحث
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  useEffect(() => {
    // إغلاق القائمة عند النقر خارجها
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className="px-4 py-2 rounded-full border border-purplelight bg-white text-dark-navy cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple transition flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-purplelight rounded-lg shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            className="w-full p-2 border-b border-purplelight focus:outline-none"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-gray-500">لا توجد نتائج</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                className={`p-2 cursor-pointer hover:bg-purplelight transition ${value === opt.value ? 'bg-purplelight font-bold' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}