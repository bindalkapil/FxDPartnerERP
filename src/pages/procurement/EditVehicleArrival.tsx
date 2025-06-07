import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, ArrowLeft, Plus, Trash2, Upload, X, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrival, updateVehicleArrival, uploadAttachment, createProduct, createSKU } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  skus: SKU[];
}

interface SKU {
  id: string;
  code: string;
  unitType: 'box' | 'loose';
  quantity: number;
  totalWeight: number;
}

interface Attachment {
  id: string;
  file: File;
  preview: string;
}

interface ExistingAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

const EditVehicleArrival: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    supplier: '',
    driverName: '',
    driverContact: '',
    arrivalTime: '',
    arrivalStatus: 'pending',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadVehicleData();
    }
  }, [id]);

  const loadVehicleData = async () => {
    if (!id) return;
    
    try {
      const data = await getVehicleArrival(id);
      
      // Set form data
      setFormData({
        vehicleNumber: data.vehicle_number || '',
        supplier: data.supplier,
        driverName: data.driver_name || '',
        driverContact: data.driver_contact || '',
        arrivalTime: data.arrival_time,
        arrivalStatus: data.status,
        notes: data.notes || ''
      });

      // Group items by product
      const productMap = new Map<string, Product>();
      
      data.vehicle_arrival_items.forEach((item: any) => {
        const productId = item.product.id;
        const productName = item.product.name;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: productName,
            skus: []
          });
        }
        
        const product = productMap.get(productId)!;
        product.skus.push({
          id: item.sku.id,
          code: item.sku.code,
          unitType: item.unit_type as 'box' | 'loose',
          quantity: item.quantity,
          totalWeight: item.total_weight
        });
      });

      setProducts(Array.from(productMap.values()));
      setExistingAttachments(data.vehicle_arrival_attachments || []);
    } catch (error) {
      console.error('Error loading vehicle arrival:', error);
      toast.error('Failed to load vehicle arrival data');
      navigate('/vehicle-arrival');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    const productId = `temp_${Date.now()}`;
    setProducts(prev => [...prev, {
      id: productId,
      name: '',
      skus: []
    }]);
  };

  const handleUpdateProductName = (productId: string, name: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId ? { ...product, name } : product
    ));
  };

  const handleAddSKU = (productId: string) => {
    const skuId = `temp_${Date.now()}`;
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          skus: [...product.skus, {
            id: skuId,
            code: '',
            unitType: 'box',
            quantity: 0,
            totalWeight: 0
          }]
        };
      }
      return product;
    }));
  };

  const handleUpdateSKU = (productId: string, skuId: string, updates: Partial<SKU>) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          skus: product.skus.map(sku => {
            if (sku.id === skuId) {
              const updatedSKU = { ...sku, ...updates };
              // Calculate total weight based on unit type and quantity
              if (updatedSKU.unitType === 'box') {
                // For box type, total weight = quantity * 1 (default unit weight)
                updatedSKU.totalWeight = updatedSKU.quantity * 1;
              } else {
                // For loose type, total weight = quantity (quantity is already in kg)
                updatedSKU.totalWeight = updatedSKU.quantity;
              }
              return updatedSKU;
            }
            return sku;
          })
        };
      }
      return product;
    }));
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
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
    const totalAttachments = attachments.length + existingAttachments.length - removedAttachments.length;
    
    if (totalAttachments + newFiles.length > 3) {
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
      if (attachmentToRemove?.preview && attachmentToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleRemoveExistingAttachment = (id: string) => {
    setRemovedAttachments(prev => [...prev, id]);
  };

  const handleRestoreExistingAttachment = (id: string) => {
    setRemovedAttachments(prev => prev.filter(attachmentId => attachmentId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier || !formData.arrivalTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Validate products and SKUs
    for (const product of products) {
      if (!product.name.trim()) {
        toast.error('Please enter product name for all products');
        return;
      }
      
      if (product.skus.length === 0) {
        toast.error(`Product "${product.name}" must have at least one SKU`);
        return;
      }

      for (const sku of product.skus) {
        if (!sku.code.trim()) {
          toast.error(`Please enter SKU code for all SKUs in "${product.name}"`);
          return;
        }
        
        if (sku.quantity <= 0) {
          toast.error(`Please enter valid quantity for all SKUs in "${product.name}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Upload new attachments
      const newAttachmentData = [];
      for (const attachment of attachments) {
        try {
          const uploadResult = await uploadAttachment(attachment.file);
          newAttachmentData.push(uploadResult);
        } catch (error) {
          console.warn('Failed to upload attachment:', attachment.file.name, error);
        }
      }

      // Process ALL products and SKUs to ensure they exist in the database
      const processedProducts = [];
      
      for (const product of products) {
        // Always create/get product by name to ensure consistency
        let dbProduct;
        try {
          dbProduct = await createProduct({
            name: product.name,
            category: 'Uncategorized',
            description: product.name,
            status: 'active'
          });
        } catch (error) {
          console.error('Error creating/getting product:', error);
          toast.error(`Failed to process product "${product.name}"`);
          return;
        }

        // Process SKUs for this product
        const processedSkus = [];
        for (const sku of product.skus) {
          // Always create/get SKU by code to ensure consistency
          let dbSku;
          try {
            dbSku = await createSKU({
              product_id: dbProduct.id,
              code: sku.code,
              unit_type: sku.unitType,
              unit_weight: sku.unitType === 'box' ? 1 : null,
              status: 'active'
            });
          } catch (error) {
            console.error('Error creating/getting SKU:', error);
            toast.error(`Failed to process SKU "${sku.code}"`);
            return;
          }

          processedSkus.push({
            id: dbSku.id,
            ...sku
          });
        }

        processedProducts.push({
          id: dbProduct.id,
          name: product.name,
          skus: processedSkus
        });
      }

      // Prepare items data with correct database IDs
      const itemsData = processedProducts.flatMap(product =>
        product.skus.map(sku => ({
          product_id: product.id,
          sku_id: sku.id,
          unit_type: sku.unitType,
          unit_weight: sku.unitType === 'box' ? 1 : null,
          quantity: sku.quantity,
          total_weight: sku.totalWeight
        }))
      );

      // Update vehicle arrival
      await updateVehicleArrival(
        id!,
        {
          vehicle_number: formData.vehicleNumber || null,
          supplier: formData.supplier,
          driver_name: formData.driverName || null,
          driver_contact: formData.driverContact || null,
          arrival_time: formData.arrivalTime,
          status: formData.arrivalStatus as any,
          notes: formData.notes || null
        },
        itemsData,
        newAttachmentData
      );

      toast.success('Vehicle arrival updated successfully!');
      navigate('/vehicle-arrival');
    } catch (error) {
      console.error('Error updating vehicle arrival:', error);
      toast.error('Failed to update vehicle arrival. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const canEdit = () => {
    return formData.arrivalStatus !== 'po-created' && formData.arrivalStatus !== 'cancelled';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicle arrival...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vehicle-arrival')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Edit Vehicle Arrival</h1>
          </div>
        </div>
      </div>

      {!canEdit() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Limited Editing
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                This vehicle arrival cannot be fully edited because its status is "{formData.arrivalStatus}". 
                You can only view and update basic information.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h2>
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
                  disabled={!canEdit()}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="po-created">Record Created</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Section - Only editable if status allows */}
          {canEdit() && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Products <span className="text-red-500">*</span></h2>

              <div className="space-y-6">
                {products.map((product, productIndex) => (
                  <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Product {productIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleUpdateProductName(product.id, e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., POMO MH, Alphonso, Washington Apple"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-800">SKUs</h4>

                      {product.skus.map((sku, skuIndex) => (
                        <div key={sku.id} className="bg-white p-4 rounded-md border">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-700">SKU {skuIndex + 1}</h5>
                            <button
                              type="button"
                              onClick={() => handleRemoveSKU(product.id, sku.id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU Code <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={sku.code}
                                onChange={(e) => handleUpdateSKU(product.id, sku.id, { code: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., POMO-MH-001"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Packaging Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={sku.unitType}
                                onChange={(e) => handleUpdateSKU(product.id, sku.id, { 
                                  unitType: e.target.value as 'box' | 'loose'
                                })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                              >
                                <option value="box">Box/Crate</option>
                                <option value="loose">Loose</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {sku.unitType === 'box' ? 'Quantity (No of Boxes)' : 'Quantity (Total Wt)'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={sku.quantity || ''}
                                onChange={(e) => handleUpdateSKU(product.id, sku.id, { quantity: Number(e.target.value) })}
                                min="0"
                                step={sku.unitType === 'loose' ? '0.1' : '1'}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>

                          {sku.quantity > 0 && (
                            <div className="mt-3 text-sm text-gray-600">
                              {sku.unitType === 'box' 
                                ? `Total Boxes: ${sku.quantity}`
                                : `Total Weight: ${sku.totalWeight} kg`
                              }
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleAddSKU(product.id)}
                          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add SKU
                        </button>
                      </div>

                      {product.skus.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No SKUs added yet. Click "Add SKU" to add the first SKU.
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="bg-green-600 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </button>
                </div>

                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products added yet. Click "Add Product" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
            <div className="space-y-4">
              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={`relative border rounded-lg p-2 ${
                          removedAttachments.includes(attachment.id) 
                            ? 'opacity-50 bg-red-50 border-red-200' 
                            : 'bg-white'
                        }`}
                      >
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
                          <span className="text-gray-500 text-sm">
                            {attachment.file_type.startsWith('image/') ? 'Image' : 'Document'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500 truncate">
                            {attachment.file_name}
                          </span>
                          {removedAttachments.includes(attachment.id) ? (
                            <button
                              type="button"
                              onClick={() => handleRestoreExistingAttachment(attachment.id)}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingAttachment(attachment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    {existingAttachments.length > 0 ? 'Add New Attachments' : 'Upload Attachments'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length + existingAttachments.length - removedAttachments.length >= 3}
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
                <p className="text-xs text-gray-500 mb-3">
                  Upload up to 3 attachments total (Images or PDF files)
                </p>

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
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
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

          {/* Form Actions */}
          <div className="border-t pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/vehicle-arrival')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVehicleArrival;