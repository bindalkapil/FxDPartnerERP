import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  category: string;
  name: string;
  sku: string;
  unitType: 'box' | 'loose';
  unitWeight?: number;
  quantity: number;
  totalWeight: number;
}

interface Attachment {
  id: string;
  file: File;
  preview: string;
}

const productData = {
  Pomegranate: {
    'POMO MH': ['POMO-MH-001', 'POMO-MH-002'],
    'POMO GJ': ['POMO-GJ-001', 'POMO-GJ-002'],
    'POMO RJ': ['POMO-RJ-001', 'POMO-RJ-002'],
  },
  Mango: {
    'Sindura': ['MNG-SIN-001', 'MNG-SIN-002'],
    'Alphonso': ['MNG-ALP-001', 'MNG-ALP-002'],
    'Banganpally': ['MNG-BNG-001', 'MNG-BNG-002'],
  },
  Imported: {
    'Washington Apple': ['IMP-APP-001', 'IMP-APP-002'],
    'Kiwi': ['IMP-KIW-001'],
    'Dragon Fruit': ['IMP-DRG-001'],
  },
};

const EditVehicleArrival: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for the existing vehicle arrival - in a real app, fetch from API based on id
  const mockVehicleData = {
    id: 'VA001',
    vehicleNumber: 'KA-01-AB-1234',
    supplier: 'Green Farms',
    driverName: 'Ramesh Kumar',
    driverContact: '9876543210',
    arrivalTime: '2025-06-18T08:30',
    arrivalStatus: 'arrived',
    notes: 'Delivery in progress',
    items: [
      {
        id: '1',
        category: 'Pomegranate',
        name: 'POMO MH',
        sku: 'POMO-MH-001',
        unitType: 'box' as const,
        unitWeight: 10,
        quantity: 100,
        totalWeight: 1000
      }
    ],
    attachments: [
      {
        id: 'att1',
        file: new File([], 'invoice.pdf', { type: 'application/pdf' }),
        preview: '/pdf-icon.png'
      }
    ]
  };
  
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    supplier: '',
    driverName: '',
    driverContact: '',
    arrivalTime: '',
    arrivalStatus: 'in-transit',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSKU, setSelectedSKU] = useState('');
  const [unitType, setUnitType] = useState<'box' | 'loose'>('box');
  const [unitWeight, setUnitWeight] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Load existing data
  useEffect(() => {
    if (id) {
      // In a real app, this would fetch data from an API
      setFormData({
        vehicleNumber: mockVehicleData.vehicleNumber,
        supplier: mockVehicleData.supplier,
        driverName: mockVehicleData.driverName,
        driverContact: mockVehicleData.driverContact,
        arrivalTime: mockVehicleData.arrivalTime,
        arrivalStatus: mockVehicleData.arrivalStatus,
        notes: mockVehicleData.notes
      });
      setProducts(mockVehicleData.items);
      setAttachments(mockVehicleData.attachments);
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    if (attachments.length + newFiles.length > 3) {
      toast.error('Maximum 3 attachments allowed');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('Only images (JPG, PNG, GIF) and PDF files are allowed');
      return;
    }

    const newAttachments = newFiles.map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      preview: file.type.startsWith('image/') 
        ? URL.createObjectURL(file)
        : '/pdf-icon.png'
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const attachmentToRemove = prev.find(a => a.id === id);
      if (attachmentToRemove?.preview) {
        URL.revokeObjectURL(attachmentToRemove.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.supplier || !formData.arrivalTime || products.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Form submitted:', { ...formData, products, attachments });
    toast.success('Vehicle arrival updated successfully');
    navigate('/vehicle-arrival');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalWeight = (): number => {
    if (unitType === 'box') {
      return quantity * unitWeight;
    }
    return quantity;
  };

  const handleAddProduct = () => {
    if (selectedCategory && selectedProduct && selectedSKU && 
        ((unitType === 'box' && unitWeight > 0) || unitType === 'loose') && 
        quantity > 0) {
      
      const totalWeight = calculateTotalWeight();
      
      setProducts(prev => [...prev, {
        id: `${Date.now()}`,
        category: selectedCategory,
        name: selectedProduct,
        sku: selectedSKU,
        unitType,
        unitWeight: unitType === 'box' ? unitWeight : undefined,
        quantity,
        totalWeight
      }]);
      
      setSelectedSKU('');
      setUnitType('box');
      setUnitWeight(0);
      setQuantity(0);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vehicle-arrival')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Edit Vehicle Arrival</h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicleNumber"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select a supplier</option>
                <option value="Green Farms">Green Farms</option>
                <option value="Fresh Harvests">Fresh Harvests</option>
                <option value="Organic Fruits Co.">Organic Fruits Co.</option>
              </select>
            </div>

            <div>
              <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">
                Driver Name
              </label>
              <input
                type="text"
                id="driverName"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="driverContact" className="block text-sm font-medium text-gray-700">
                Driver Contact
              </label>
              <input
                type="text"
                id="driverContact"
                name="driverContact"
                value={formData.driverContact}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700">
                Arrival Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="arrivalTime"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="arrivalStatus" className="block text-sm font-medium text-gray-700">
                Arrival Status <span className="text-red-500">*</span>
              </label>
              <select
                id="arrivalStatus"
                name="arrivalStatus"
                value={formData.arrivalStatus}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="in-transit">In Transit</option>
                <option value="arrived">Arrived</option>
                <option value="unloading">Unloading</option>
                <option value="unloaded">Unloaded</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Products <span className="text-red-500">*</span></h2>
            
            {/* Product Category and Name Selection */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">1. Select Product Category and Name</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedProduct('');
                      setSelectedSKU('');
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(productData).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setSelectedSKU('');
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedCategory}
                  >
                    <option value="">Select Product</option>
                    {selectedCategory && Object.keys(productData[selectedCategory]).map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SKU Details */}
            {selectedCategory && selectedProduct && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">2. Add SKU Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <select
                      value={selectedSKU}
                      onChange={(e) => setSelectedSKU(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select SKU</option>
                      {productData[selectedCategory][selectedProduct].map(sku => (
                        <option key={sku} value={sku}>{sku}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Type</label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value as 'box' | 'loose')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="box">Box/Crate</option>
                      <option value="loose">Loose</option>
                    </select>
                  </div>

                  {unitType === 'box' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Weight (kg)</label>
                      <input
                        type="number"
                        value={unitWeight}
                        onChange={(e) => setUnitWeight(Number(e.target.value))}
                        min="0"
                        step="0.1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {unitType === 'box' ? 'Number of Boxes' : 'Total Weight (kg)'}
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="0"
                      step={unitType === 'loose' ? '0.1' : '1'}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!selectedSKU || quantity <= 0 || (unitType === 'box' && unitWeight <= 0)}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5 inline-block" />
                      Add SKU
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table */}
            {products.length > 0 && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Weight
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unitType === 'box' ? 'Box/Crate' : 'Loose'}
                          {product.unitType === 'box' && product.unitWeight && ` (${product.unitWeight}kg)`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.quantity} {product.unitType === 'box' ? 'boxes' : 'kg'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.totalWeight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Upload up to 3 attachments (Images or PDF files)
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 3}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative border rounded-lg p-2 group"
                    >
                      {attachment.file.type.startsWith('image/') ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
                          <span className="text-gray-500">PDF Document</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-500 truncate">
                          {attachment.file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Any special instructions or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/vehicle-arrival')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVehicleArrival;