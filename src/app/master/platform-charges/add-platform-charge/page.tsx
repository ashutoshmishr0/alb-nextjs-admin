'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base_url } from '@/lib/api-routes';
import Swal from 'sweetalert2';

const AddPlatformCharge = () => {
  const router = useRouter();

  const [inputFieldDetail, setInputFieldDetail] = useState({ platform_charges: '' });
  const [inputFieldError, setInputFieldError] = useState({ platform_charges: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: string, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputFieldDetail({ ...inputFieldDetail, [name]: value ? Number(value) : '' });
    handleInputFieldError(name, '');
  };

  //* Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;
    const { platform_charges } = inputFieldDetail;

    if (!platform_charges || Number(platform_charges) <= 0) {
      handleInputFieldError('platform_charges', 'Please enter a valid platform charge amount');
      isValid = false;
    }

    return isValid;
  };

  //* Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleValidation()) return;

    const { platform_charges } = inputFieldDetail;

    try {
      setIsSubmitting(true);

      // Show loading
      Swal.fire({
        title: 'Creating Platform Charge...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`/api/admin/create-platform-charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformChargeAmount: platform_charges }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create platform charge');
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Platform charge created successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form
      setInputFieldDetail({ platform_charges: '' });
      
      // Redirect back to platform charges list page
      router.push('/master/platform-charges');
      
      // Force refresh the page to show updated data
      router.refresh();

    } catch (error) {
      console.error('Error creating platform charge:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to create platform charge. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  //* Handle Cancel - Go back to list
  const handleCancel = () => {
    router.push('/master/platform-charges');
  };

  return (
    <>
      {/* Form Section */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fff',
          marginBottom: '20px',
          boxShadow: '0px 0px 5px lightgrey',
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#000',
            marginBottom: '30px',
          }}
        >
          Add Platform Charge
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
              >
                Platform Charge Amount (₹) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="platform_charges"
                value={inputFieldDetail.platform_charges}
                onChange={handleInputField}
                onFocus={() => handleInputFieldError('platform_charges', '')}
                placeholder="e.g., 100"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: inputFieldError.platform_charges
                    ? '1px solid red'
                    : '1px solid #ccc',
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
                  cursor: isSubmitting ? 'not-allowed' : 'text',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              />
              {inputFieldError.platform_charges && (
                <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
                  {inputFieldError.platform_charges}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  fontWeight: '500',
                  backgroundColor: isSubmitting ? '#ccc' : '#e63946',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  border: 'none',
                  outline: 'none',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                style={{
                  fontWeight: '500',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  border: 'none',
                  outline: 'none',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddPlatformCharge;