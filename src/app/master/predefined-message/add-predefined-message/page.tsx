'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { base_url } from '@/lib/api-routes';
import Swal from 'sweetalert2';

type MessageType = 'Astrologer' | 'Customer' | '';

// Separate component that uses useSearchParams
function AddPredefinedMessageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputFieldDetail, setInputFieldDetail] = useState({
    message: '',
    type: '' as MessageType,
    mode: 'Add' as 'Add' | 'Edit',
    id: '',
  });
  const [inputFieldError, setInputFieldError] = useState({
    message: '',
    type: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data from URL params if in edit mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'Edit') {
      setInputFieldDetail({
        id: searchParams.get('id') || '',
        type: (searchParams.get('type') as MessageType) || '',
        message: searchParams.get('message') || '',
        mode: 'Edit',
      });
    }
  }, [searchParams]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof typeof inputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail({ ...inputFieldDetail, [name]: value });
    if (name in inputFieldError) {
      handleInputFieldError(name as keyof typeof inputFieldError, '');
    }
  };

  //* Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;

    if (!inputFieldDetail.message.trim()) {
      handleInputFieldError('message', 'Please enter a message');
      isValid = false;
    }
    if (!inputFieldDetail.type) {
      handleInputFieldError('type', 'Please select a type');
      isValid = false;
    }

    return isValid;
  };

  //* Handle Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    const { message, type, mode, id } = inputFieldDetail;

    const url = `/api/admin/${
      mode === 'Add' ? 'create_predefined_message' : 'update_predefined_message'
    }`;

    const body: any = { message, type };
    if (mode === 'Edit') body.id = id;

    try {
      setIsSubmitting(true);

      // Show loading
      Swal.fire({
        title: mode === 'Add' ? 'Creating Message...' : 'Updating Message...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${mode.toLowerCase()} message`);
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Message ${mode === 'Add' ? 'created' : 'updated'} successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Redirect back to messages list page
      router.push('/master/predefined-message');
      
      // Force refresh the page to show updated data
      router.refresh();

    } catch (error: any) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || `Failed to ${mode === 'Add' ? 'create' : 'update'} message`,
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  //* Handle Cancel - Go back to list
  const handleCancel = () => {
    router.push('/master/predefined-message');
  };

  return (
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
        {inputFieldDetail.mode === 'Add' ? 'Add Predefined Message' : 'Edit Predefined Message'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Select Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Select Type <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="type"
              value={inputFieldDetail.type}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError('type', '')}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: inputFieldError.type ? '1px solid red' : '1px solid #ccc',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: '#fff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <option value="" disabled>---Select Type---</option>
              <option value="Astrologer">Astrologer</option>
              <option value="Customer">Customer</option>
            </select>
            {inputFieldError.type && (
              <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
                {inputFieldError.type}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Message <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              name="message"
              value={inputFieldDetail.message}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError('message', '')}
              placeholder="Enter your predefined message..."
              rows={5}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: inputFieldError.message ? '1px solid red' : '1px solid #ccc',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                cursor: isSubmitting ? 'not-allowed' : 'text',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            />
            {inputFieldError.message && (
              <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
                {inputFieldError.message}
              </p>
            )}
          </div>

          {/* Submit and Cancel Buttons */}
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
              {isSubmitting 
                ? (inputFieldDetail.mode === 'Add' ? 'Creating...' : 'Updating...') 
                : (inputFieldDetail.mode === 'Add' ? 'Add Message' : 'Update Message')
              }
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
  );
}

// Main component with Suspense boundary
const AddPredefinedMessage = () => {
  return (
    <Suspense fallback={
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        marginBottom: '20px',
        boxShadow: '0px 0px 5px lightgrey',
        borderRadius: '10px',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    }>
      <AddPredefinedMessageForm />
    </Suspense>
  );
};

export default AddPredefinedMessage;