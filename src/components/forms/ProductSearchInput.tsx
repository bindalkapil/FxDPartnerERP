import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package } from 'lucide-react';

interface InventoryItem {
  product_id: string;
  product_name: string;
  product_category: string;
  sku_id: string;
  sku_code: string;
  unit_type: string;
  available_quantity: number;
  total_weight: number;
}

interface ProductSearchInputProps {
  inventory: InventoryItem[];
  value: string;
  onChange: (skuId: string) => void;
  placeholder?: string;
  className?: string;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  inventory,
  value,
  onChange,
  placeholder = "Type to search products...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected item to display its name
  const selectedItem = inventory.find(item => item.sku_id === value);

  useEffect(() => {
    if (selectedItem && !isOpen) {
      setSearchTerm(`${selectedItem.product_name} - ${selectedItem.sku_code}`);
    }
  }, [selectedItem, isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(inventory.slice(0, 10)); // Show first 10 items when empty
    } else {
      const filtered = inventory.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.product_name.toLowerCase().includes(searchLower) ||
          item.sku_code.toLowerCase().includes(searchLower) ||
          item.product_category.toLowerCase().includes(searchLower)
        );
      }).slice(0, 10); // Limit to 10 results
      
      setFilteredItems(filtered);
    }
    setSelectedIndex(-1);
  }, [searchTerm, inventory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if user is typing
    if (newValue !== `${selectedItem?.product_name} - ${selectedItem?.sku_code}`) {
      onChange('');
    }
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSearchTerm(`${item.product_name} - ${item.sku_code}`);
    onChange(item.sku_id);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
          handleItemSelect(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Clear the input to allow fresh search
    if (selectedItem) {
      setSearchTerm('');
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setIsOpen(false);
      // Restore the selected item name if nothing was selected
      if (selectedItem && !value) {
        setSearchTerm(`${selectedItem.product_name} - ${selectedItem.sku_code}`);
      } else if (!selectedItem) {
        setSearchTerm('');
      }
    }, 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${className}`}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto"
        >
          {filteredItems.length > 0 ? (
            <ul className="py-1">
              {filteredItems.map((item, index) => (
                <li
                  key={item.sku_id}
                  onClick={() => handleItemSelect(item)}
                  className={`px-3 py-2 cursor-pointer transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-green-50 text-green-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.sku_code} • {item.product_category} • {item.unit_type}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.available_quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              {searchTerm.trim() === '' ? 'Start typing to search products...' : 'No products found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchInput;