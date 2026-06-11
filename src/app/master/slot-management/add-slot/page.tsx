'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base_url } from '@/lib/api-routes';
import Swal from 'sweetalert2';

const AddSlot = () => {
  const router = useRouter();

  const [inputFieldDetail, setInputFieldDetail] = useState({ slot_duration: '' });
  const [inputFieldError, setInputFieldError] = useState({ slot_duration: '' });
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
    const { slot_duration } = inputFieldDetail;

    const duration = Number(slot_duration);
    if (!slot_duration || duration <= 0) {
      handleInputFieldError('slot_duration', 'Please enter a valid slot duration');
      isValid = false;
    }

    return isValid;
  };

  //* Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleValidation()) return;

    const { slot_duration } = inputFieldDetail;

    try {
      setIsSubmitting(true);

      // Show loading
      Swal.fire({
        title: 'Creating Slot...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`/api/admin/create_slots_duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotDuration: slot_duration }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create slot duration');
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Slot duration created successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form
      setInputFieldDetail({ slot_duration: '' });
      
      // Redirect back to slot management list page
      router.push('/master/slot-management');
      
      // Force refresh the page to show updated data
      router.refresh();

    } catch (error) {
      console.error('Error creating slot duration:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to create slot duration. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  //* Handle Cancel - Go back to list
  const handleCancel = () => {
    router.push('/master/slot-management');
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
          Add Slot Duration
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
              >
                Slot Duration (in minutes) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="slot_duration"
                value={inputFieldDetail.slot_duration}
                onChange={handleInputField}
                onFocus={() => handleInputFieldError('slot_duration', '')}
                placeholder="e.g., 30"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: inputFieldError.slot_duration
                    ? '1px solid red'
                    : '1px solid #ccc',
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
                  cursor: isSubmitting ? 'not-allowed' : 'text',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              />
              {inputFieldError.slot_duration && (
                <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
                  {inputFieldError.slot_duration}
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

export default AddSlot;