import { useState } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

const sortOptions = [
  { id: 'newest', name: 'Newest', value: 'newest' },
  { id: 'price-low-high', name: 'Price: Low to High', value: 'price-asc' },
  { id: 'price-high-low', name: 'Price: High to Low', value: 'price-desc' },
  { id: 'name-asc', name: 'Name: A to Z', value: 'name-asc' },
  { id: 'name-desc', name: 'Name: Z to A', value: 'name-desc' },
];

const ProductSort = ({ onSortChange, className = '' }) => {
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);

  const handleChange = (option) => {
    setSelectedSort(option);
    if (onSortChange) {
      onSortChange(option.value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Listbox value={selectedSort} onChange={handleChange}>
        {({ open }) => (
          <>
            <Listbox.Label className="sr-only">Sort products</Listbox.Label>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                <span className="block truncate">Sort by: {selectedSort.name}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {sortOptions.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {option.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default ProductSort;
