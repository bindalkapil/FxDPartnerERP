import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SKU {
  id: string;
  code: string;
  unitType: 'box' | 'loose';
  unitWeight?: number;
  quantity: number;
  totalWeight: number;
}

interface Product {
  id: string;
  name: string;
  skus: SKU[];
}

interface Attachment {
  id: string;
  file: File;
  preview: string;
}

const NewVehicleArrival: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [newProduct, setNewProduct] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // SKU form state
  const [newSKU, setNewSKU] = useState({
    code: '',
    unitType: 'box' as const,
    unitWeight: 0,
    quantity: 0
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleAddProduct = () => {
    if (!newProduct.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    const productId = `${Date.now()}`;
    setProducts(prev => [...prev, {
      id: productId,
      name: newProduct,
      skus: []
    }]);

    setNewProduct('');
    setEditingProductId(productId);
    setShowProductForm(false);
  };

  const handleAddSKU = (productId: string) => {
    if (!newSKU.code.trim() || 
        (newSKU.unitType === 'box' && newSKU.unitWeight <= 0) || 
        newSKU.quantity <= 0) {
      toast.error('Please fill in all SKU details');
      return;
    }

    const totalWeight = newSKU.unitType === 'box' 
      ? newSKU.quantity * newSKU.unitWeight 
      : newSKU.quantity;

    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          skus: [...product.skus, {
            id: `${Date.now()}`,
            code: newSKU.code,
            unitType: newSKU.unitType,
            unitWeight: newSKU.unitType === 'box' ? newSKU.unitWeight : undefined,
            quantity: newSKU.quantity,
            totalWeight
          }]
        };
      }
      return product;
    }));

    // Reset SKU form
    setNewSKU({
      code: '',
      unitType: 'box',
      unitWeight: 0,
      quantity: 0
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (editingProductId === productId) {
      setEditingProductId(null);
    }
  };

  const handleRemoveSKU = (productId: string, skuId: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          skus: product.skus.filter(sku => sku.id !== skuId)
        };
      }
      return product;
    }));
  };

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
    
    if (!formData.supplier || !formData.arrivalTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    if (products.some(p => p.skus.length === 0)) {
      toast.error('Each product must have at least one SKU');
      return;
    }

    console.log('Form submitted:', { ...formData, products, attachments });
    navigate('/vehicle-arrival');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
            <h1 className="text-2xl font-bold text-gray-800">New Vehicle Arrival</h1>
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

          {/* Products Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Products <span className="text-red-500">*</span></h2>
              <button
                type="button"
                onClick={() => setShowProductForm(true)}
                className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {showProductForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter product name"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({product.skus.length} SKUs)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingProductId(editingProductId === product.id ? null : product.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {editingProductId === product.id ? 'Close' : 'Add SKU'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* SKU List */}
                  {product.skus.length > 0 && (
                    <div className="p-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Weight</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.skus.map((sku) => (
                            <tr key={sku.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900">{sku.code}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {sku.unitType === 'box' ? `Box (${sku.unitWeight}kg)` : 'Loose'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {sku.quantity} {sku.unitType === 'box' ? 'boxes' : 'kg'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">{sku.totalWeight} kg</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSKU(product.id, sku.id)}
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

                  {/* Add SKU Form */}
                  {editingProductId === product.id && (
                    <div className="p-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">SKU Code</label>
                          <input
                            type="text"
                            value={newSKU.code}
                            onChange={(e) => setNewSKU({ ...newSKU, code: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Unit Type</label>
                          <select
                            value={newSKU.unitType}
                            onChange={(e) => setNewSKU({ ...newSKU, unitType: e.target.value as 'box' | 'loose' })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="box">Box/Crate</option>
                            <option value="loose">Loose</option>
                          </select>
                        </div>

                        {newSKU.unitType === 'box' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Unit Weight (kg)</label>
                            <input
                              type="number"
                              value={newSKU.unitWeight}
                              onChange={(e) => setNewSKU({ ...newSKU, unitWeight: Number(e.target.value) })}
                              min="0"
                              step="0.1"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {newSKU.unitType === 'box' ? 'Number of Boxes' : 'Total Weight (kg)'}
                          </label>
                          <input
                            type="number"
                            value={newSKU.quantity}
                            onChange={(e) => setNewSKU({ ...newSKU, quantity: Number(e.target.value) })}
                            min="0"
                            step={newSKU.unitType === 'loose' ? '0.1' : '1'}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div className="md:col-span-4">
                          <button
                            type="button"
                            onClick={() => handleAddSKU(product.id)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add SKU
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              Create Arrival
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVehicleArrival;