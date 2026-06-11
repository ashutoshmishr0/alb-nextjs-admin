'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface RemediesDetail {
  title: string;
  description: string;
}

interface InputFieldError {
  title: string;
  description: string;
  image: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
}

interface RemedyData {
  _id: string;
  title: string;
  description: string;
  remedy?: string;
}

const EditRemedies: React.FC = () => {
  const router = useRouter();
  const [remediesDetail, setRemediesDetail] = useState<RemediesDetail>({ title: '', description: '' });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ title: '', description: '', image: '' });
  const [image, setImage] = useState<ImageState>({ file: '', bytes: null });
  const [loading, setLoading] = useState(false);
  const [remedyId, setRemedyId] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const Regex_Accept_Alpha = /^[a-zA-Z\s]*$/;

  // Load remedy data from sessionStorage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('editRemedyData');
      if (storedData) {
        const remedy: RemedyData = JSON.parse(storedData);
        setRemediesDetail({
          title: remedy.title || '',
          description: remedy.description || '',
        });
        setRemedyId(remedy._id);
        setDataLoaded(true);
        sessionStorage.removeItem('editRemedyData');
      }
    } catch (error) {
      console.error('Error loading remedy data:', error);
      router.push('/remedies');
    }
  }, [router]);

  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  const handleInputChange = (field: keyof RemediesDetail, value: string) => {
    setRemediesDetail((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (inputFieldError[field as keyof InputFieldError]) {
      handleInputFieldError(field as keyof InputFieldError, '');
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.target.files[0]),
        bytes: e.target.files[0],
      });
    }
    handleInputFieldError('image', '');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.dataTransfer.files[0]),
        bytes: e.dataTransfer.files[0],
      });
    }
    handleInputFieldError('image', '');
  };

  const handleValidation = (): boolean => {
    let isValid = true;
    const { title, description } = remediesDetail;

    if (!title.trim()) {
      handleInputFieldError('title', 'Please Enter Title');
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError('title', 'Please Enter Valid Title (Letters only)');
      isValid = false;
    }

    if (!description.trim()) {
      handleInputFieldError('description', 'Please Enter Description');
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(description)) {
      handleInputFieldError('description', 'Please Enter Valid Description (Letters only)');
      isValid = false;
    }

    return isValid;
  };

  const updateRemedies = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/update-remedy`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating remedy:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    const { title, description } = remediesDetail;

    try {
      const formData = new FormData();
      formData.append('remedyId', remedyId);
      formData.append('title', title);
      formData.append('description', description);
      if (image.bytes) formData.append('remedyIcon', image.bytes);

      const result = await updateRemedies(formData);

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Remedy updated successfully',
          timer: 1500,
          showConfirmButton: false,
        });
        setTimeout(() => router.push('/remedies'), 1600);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: result.message || 'Failed to update remedy',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error!',
        text: 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading...</div>

        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 10px;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 4px solid #ef4444;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            font-size: 16px;
            color: #555;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .container {
          background: #f9fafb;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }
        .display-btn {
          background: #ef4444;
          border: none;
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .display-btn:hover {
          background: #dc2626;
        }
        .field {
          margin-bottom: 20px;
        }
        .label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          display: block;
        }
        .required {
          color: #ef4444;
        }
        .input,
        .textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus,
        .textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .error {
          border-color: #ef4444;
        }
        .error-text {
          color: #ef4444;
          font-size: 13px;
          margin-top: 4px;
        }
        .dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .dropzone:hover {
          border-color: #9ca3af;
        }
        .img-preview {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          object-fit: cover;
          margin-bottom: 8px;
        }
        .submit-btn {
          background: #ef4444;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .submit-btn:hover {
          background: #dc2626;
        }
        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="container">
        <div className="card">
          <div className="header">
            <div className="title">Edit Remedies</div>
            <button className="display-btn" onClick={() => router.push('/remedies')}>
              Display
            </button>
          </div>

          {/* Title */}
          <div className="field">
            <label className="label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={remediesDetail.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFieldError('title', '')}
              className={`input ${inputFieldError.title ? 'error' : ''}`}
              placeholder="Enter remedy title"
            />
            {inputFieldError.title && <p className="error-text">{inputFieldError.title}</p>}
          </div>

          {/* Description */}
          <div className="field">
            <label className="label">
              Description <span className="required">*</span>
            </label>
            <textarea
              value={remediesDetail.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onFocus={() => handleInputFieldError('description', '')}
              rows={4}
              className={`textarea ${inputFieldError.description ? 'error' : ''}`}
              placeholder="Enter remedy description"
            />
            {inputFieldError.description && (
              <p className="error-text">{inputFieldError.description}</p>
            )}
          </div>

          {/* Image Upload */}
          {/* <div className="field">
            <label className="label">Remedy Icon (Optional)</label>
            <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => document.getElementById('upload-image')?.click()}>
              {image.file ? (
                <div>
                  <img src={image.file} alt="Remedy" className="img-preview" />
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Click or drag to change image</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '24px', color: '#9ca3af' }}>+</div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Click or drag to upload image</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Optional remedy icon</p>
                </div>
              )}
              <input id="upload-image" type="file" accept="image/*" hidden onChange={handleImage} />
            </div>
          </div> */}

          {/* Submit */}
          <div style={{ marginTop: '20px' }}>
            <button className="submit-btn" disabled={loading} onClick={handleSubmit}>
              {loading ? (
                <>
                  <div className="spinner" /> Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditRemedies;
