'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { YYYYMMDD } from '@/utils/common-function';
import Swal from 'sweetalert2';

interface CustomerDetail {
  customerName: string;
  phoneNumber: string;
  gender: string;
  wallet: string;
  dateOfBirth: string;
  timeOfBirth: string;
}

const AddCustomerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const customerId = searchParams.get('id');
  const isEditMode = !!customerId;

  const [detail, setDetail] = useState<CustomerDetail>({
    customerName: '',
    phoneNumber: '',
    gender: '',
    wallet: '',
    dateOfBirth: '',
    timeOfBirth: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [image, setImage] = useState<{ file: string; bytes: File | null }>({
    file: '',
    bytes: null,
  });
  const [loading, setLoading] = useState(false);

  /* ---------- Extract time from datetime string ---------- */
  const extractTime = (datetime: string): string => {
    if (!datetime) return '';
    
    try {
      if (datetime.includes('T')) {
        const timePart = datetime.split('T')[1];
        const timeOnly = timePart.split('.')[0];
        return timeOnly.substring(0, 5);
      }
      
      if (datetime.includes(':')) {
        return datetime.substring(0, 5);
      }
    } catch (e) {
      console.error('Error extracting time:', e);
    }
    
    return '';
  };

  /* ---------- Extract date from datetime string ---------- */
  const extractDate = (datetime: string): string => {
    if (!datetime) return '';
    
    try {
      if (datetime.includes('T')) {
        return datetime.split('T')[0];
      }
      
      if (datetime.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datetime;
      }
      
      return YYYYMMDD(datetime);
    } catch (e) {
      console.error('Error extracting date:', e);
      return '';
    }
  };

  /* ---------- Fill form from URL params ---------- */
  useEffect(() => {
    if (isEditMode) {
      const customerName = searchParams.get('customerName') || '';
      const phoneNumber = searchParams.get('phoneNumber') || '';
      const gender = searchParams.get('gender') || '';
      const wallet_balance = searchParams.get('wallet_balance') || '0';
      const dateOfBirth = searchParams.get('dateOfBirth') || '';
      const timeOfBirth = searchParams.get('timeOfBirth') || '';
      const imageUrl = searchParams.get('image') || '';

      setDetail({
        customerName,
        phoneNumber,
        gender,
        wallet: wallet_balance,
        dateOfBirth: extractDate(dateOfBirth),
        timeOfBirth: extractTime(timeOfBirth),
      });

      if (imageUrl) {
        setImage({ file: imageUrl, bytes: null });
      }
    }
  }, [searchParams, isEditMode]);

  /* ---------- Image handling ---------- */
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file: URL.createObjectURL(file), bytes: file });
    }
    setError('image', undefined);
  };

  const setError = (field: string, msg: string | undefined) => {
    setErrors((prev: any) => ({ ...prev, [field]: msg }));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
    setError(name, undefined);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
    setError(name, undefined);
  };

  /* ---------- Validation ---------- */
  const validate = () => {
    let ok = true;
    const namePat = /^[a-zA-Z\s]{1,56}$/;
    const phonePat = /^[0-9]{10}$/;
    const { customerName, phoneNumber, gender, dateOfBirth, timeOfBirth } = detail;

    if (!customerName) { 
      setError('customerName', 'Enter name'); 
      ok = false; 
    } else if (customerName.length > 30) { 
      setError('customerName', 'Name ≤30 chars'); 
      ok = false; 
    } else if (!namePat.test(customerName)) { 
      setError('customerName', 'Invalid name'); 
      ok = false; 
    }

    if (!phoneNumber) { 
      setError('phoneNumber', 'Enter phone'); 
      ok = false; 
    } else if (!phonePat.test(phoneNumber)) { 
      setError('phoneNumber', 'Invalid phone'); 
      ok = false; 
    }

    if (!gender) { 
      setError('gender', 'Select gender'); 
      ok = false; 
    }
    if (!dateOfBirth) { 
      setError('dateOfBirth', 'Select DOB'); 
      ok = false; 
    }
    if (!timeOfBirth) { 
      setError('timeOfBirth', 'Select TOB'); 
      ok = false; 
    }

    return ok;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const fd = new FormData();
    if (isEditMode && customerId) fd.append('customerId', customerId);
    fd.append('customerName', detail.customerName);
    fd.append('phoneNumber', detail.phoneNumber);
    fd.append('gender', detail.gender);
    fd.append('wallet', detail.wallet || '0');
    fd.append('dateOfBirth', detail.dateOfBirth);
    fd.append('timeOfBirth', detail.timeOfBirth);
    if (image.bytes) fd.append('image', image.bytes);

    const url = isEditMode
      ? `/api/admin/update-customer-data`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/customers/customer-signup`;

    try {
      const res = await fetch(url, { method: 'POST', body: fd });
      const json = await res.json();

      if (res.ok && json.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: isEditMode ? 'Customer updated successfully!' : 'Customer created successfully!',
          confirmButtonColor: '#3085d6',
        });
        
        router.push('/customer');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: json.message || 'Something went wrong',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to process request',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Get image source ---------- */
  const getImageSrc = () => {
    if (!image.file) return '';
    
    if (image.file.startsWith('blob:')) {
      return image.file;
    }
    
    return `${process.env.NEXT_PUBLIC_IMAGE_URL2}${image.file}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header - Compact */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-white">
                {isEditMode ? 'Edit Customer' : 'Add New Customer'}
              </h1>
              <button
                onClick={() => router.push('/customer')}
                className="bg-white text-red-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Display
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Image Upload Section - More Compact */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Customer Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors bg-gray-50">
                {image.file ? (
                  <div className="flex justify-center p-2">
                    <img
                      src={getImageSrc()}
                      alt="Customer"
                      className="h-24 object-contain"
                    />
                  </div>
                ) : (
                  <label
                    htmlFor="upload-image"
                    className="flex flex-col items-center justify-center py-4 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </label>
                )}
                <input id="upload-image" type="file" accept="image/*" hidden onChange={handleImage} />
              </div>
            </div>

            {/* Form Fields - Tight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={detail.customerName}
                  onChange={handleInput}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${
                    errors.customerName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter name"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-xs mt-1">{errors.customerName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={detail.phoneNumber}
                  onChange={handleInput}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${
                    errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone"
                  maxLength={10}
                />
                {errors.phoneNumber && (
                  <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={detail.gender}
                  onChange={handleSelect}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${
                    errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-red-600 text-xs mt-1">{errors.gender}</p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={detail.dateOfBirth}
                  onChange={handleInput}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${
                    errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* TOB - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Time of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="timeOfBirth"
                  value={detail.timeOfBirth}
                  onChange={handleInput}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${
                    errors.timeOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.timeOfBirth && (
                  <p className="text-red-600 text-xs mt-1">{errors.timeOfBirth}</p>
                )}
              </div>
            </div>

            {/* Submit Button - Compact */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2 rounded text-white text-sm font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span>{isEditMode ? 'Update Customer' : 'Add Customer'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerContent;