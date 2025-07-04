import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
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
  onChange: (inventoryId: string, selectedItem?: InventoryItem) => void;
  placeholder?: string;
  className?: string;
  onAdjustInventory?: (item: InventoryItem) => void;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  inventory,
  value,
  onChange,
  placeholder = "Search products...",
  className = "",
  onAdjustInventory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the currently selected item by unique ID
  const selectedItem = inventory.find(item => item.id === value);

  // Update input value when selection changes
  useEffect(() => {
    if (selectedItem) {
      setInputValue(`${selectedItem.product_name} - ${selectedItem.sku_code}`);
    } else {
      setInputValue('');
    }
  }, [selectedItem]);

  // Filter items based on input value
  const filteredItems = React.useMemo(() => {
    if (!inputValue.trim()) {
      return inventory.slice(0, 50); // Limit to first 50 items when no search
    }

    const searchTerms = inputValue.toLowerCase().split(/\s+/);
    const filtered = inventory.filter(item => {
      const searchableText = [
        item.product_name,
        item.sku_code,
        item.product_category
      ].map(text => (text || '').toLowerCase()).join(' ');

      return searchTerms.every(term => searchableText.includes(term));
    }).slice(0, 50); // Limit results to 50 items

    // Debug logging for Premium SKU searches
    if (inputValue.toLowerCase().includes('premium')) {
      console.log('🔍 ProductSearchInput - Filtering for Premium SKUs:', {
        searchInput: inputValue,
        totalInventory: inventory.length,
        filteredResults: filtered.length,
        premiumItems: filtered.filter(item => item.sku_code === 'Premium').map(item => ({
          product_name: item.product_name,
          sku_code: item.sku_code,
          sku_id: item.sku_id,
          displayText: `${item.product_name} - ${item.sku_code}`
        }))
      });
    }

    return filtered;
  }, [inputValue, inventory]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(newValue)
    setInputValue(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);

    // Clear selection if user is typing something different from the selected item
    if (selectedItem) {
      const expectedValue = `${selectedItem.product_name} - ${selectedItem.sku_code}`;
      
      // If the user is typing something new (not just deleting text from the current selection)
      // or if they've completely cleared the input, reset the selection
      if ((newValue !== expectedValue && newValue !== expectedValue.substring(0, newValue.length)) || newValue === '') {
        console.log('Clearing selection due to input change:', {
          newValue,
          expectedValue,
          selectedItem: selectedItem.sku_id
        });
        // Clear selection - this will prevent table updates until user makes a definitive selection
        // Pass undefined as selectedItem to indicate intentional clearing
        onChange('', undefined);
      }
    }
  };

  // Handle item selection
  const handleSelectItem = (item: InventoryItem) => {
    // Enhanced validation that the item exists in current inventory
    const itemExists = inventory.find(inv =>
      inv.sku_id === item.sku_id &&
      inv.product_id === item.product_id
    );

    if (!itemExists) {
      console.error('Selected item not found in inventory:', item);
      toast.error('Selected product not found in current inventory. Please refresh and try again.');
      return;
    }

    // Additional validation for required fields
    if (!item.sku_id || !item.product_id || !item.product_name || !item.sku_code) {
      console.error('Selected item has missing required fields:', item);
      toast.error('Selected product has incomplete data. Please contact support.');
      return;
    }

    console.log('🎯 ProductSearchInput - Processing selected item:', {
      originalItem: {
        sku_id: item.sku_id,
        product_name: item.product_name,
        sku_code: item.sku_code,
        product_id: item.product_id
      }
    });

    // CRITICAL FIX: Always use the exact item that was clicked
    // Create a clean copy to ensure no reference issues
    const selectedItemCopy: InventoryItem = {
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_category: item.product_category,
      sku_id: item.sku_id,
      sku_code: item.sku_code,
      unit_type: item.unit_type,
      available_quantity: item.available_quantity,
      total_weight: item.total_weight
    };

    console.log('📤 ProductSearchInput - About to call onChange with:', {
      skuIdParam: item.sku_id,
      selectedItemParam: {
        product_id: selectedItemCopy.product_id,
        product_name: selectedItemCopy.product_name,
        sku_code: selectedItemCopy.sku_code,
        sku_id: selectedItemCopy.sku_id
      },
      expectedResult: `Should show "${selectedItemCopy.product_name}" in table`
    });

    // Pass the unique ID to ensure correct selection
    onChange(item.id, selectedItemCopy);
    setInputValue(`${item.product_name} - ${item.sku_code}`);

    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
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
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus/blur
  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking inside dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }

    // Use timeout to allow click events to process
    setTimeout(() => {
      setIsOpen(false);
      // Restore selected item text if we have a selection and input doesn't match
      if (selectedItem) {
        const expectedValue = `${selectedItem.product_name} - ${selectedItem.sku_code}`;
        if (inputValue !== expectedValue) {
          console.log('Restoring input value on blur:', {
            currentInput: inputValue,
            expectedValue,
            selectedItem: selectedItem.sku_id
          });
          setInputValue(expectedValue);
        }
      }
    }, 200);
  };

  // Handle adjust inventory click
  const handleAdjustInventory = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    if (onAdjustInventory) {
      onAdjustInventory(item);
    }
  };

  // Create portal root if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('portal-root')) {
      const portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      document.body.appendChild(portalRoot);
    }
  }, []);

  // Get portal root
  const portalRoot = document.getElementById('portal-root');

  // Calculate dropdown position
  const dropdownPosition = React.useMemo(() => {
    if (!isOpen || !inputRef.current) return null;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Show dropdown above if there's more space above and not enough below
    const showAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    
    return {
      top: showAbove ? rect.top + window.scrollY - 200 : rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight: showAbove ? Math.min(spaceAbove - 10, 300) : Math.min(spaceBelow - 10, 300)
    };
  }, [isOpen]);

  // Render dropdown
  const renderDropdown = () => {
    if (!isOpen || !portalRoot || !dropdownPosition) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight: dropdownPosition.maxHeight,
          zIndex: 9999
        }}
        className="bg-white border border-gray-300 rounded-md shadow-lg overflow-auto"
      >
        {filteredItems.length > 0 ? (
          <ul className="py-1">
            {filteredItems.map((item, index) => (
              <li
                key={`${item.product_id}_${item.sku_id}_${index}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 DROPDOWN ITEM CLICKED:', {
                    index,
                    clickedItem: {
                      product_id: item.product_id,
                      product_name: item.product_name,
                      sku_code: item.sku_code,
                      sku_id: item.sku_id
                    },
                    userExpectedSelection: `${item.product_name} - ${item.sku_code}`
                  });
                  handleSelectItem(item);
                }}
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
                        {item.sku_code} • {item.product_category || 'Uncategorized'} • {item.unit_type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-xs ${
                      item.available_quantity < 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                    }`}>
                      {item.available_quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                    </div>
                    {item.available_quantity < 0 && onAdjustInventory && (
                      <button
                        onClick={(e) => handleAdjustInventory(e, item)}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                        title="Adjust Inventory"
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">
            {inputValue.trim() === '' ? 'Start typing to search products...' : 'No products found'}
          </div>
        )}
      </div>,
      portalRoot
    );
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
          value={inputValue}
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
      {renderDropdown()}
    </div>
  );
};

export default ProductSearchInput;
