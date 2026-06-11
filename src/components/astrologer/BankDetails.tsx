// components/astrologer/BankDetails.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Check, Upload, FileText, X } from 'lucide-react';

interface BankDetailsProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function BankDetails({ astrologerId, initialData, onUpdate }: BankDetailsProps) {
  const [form, setForm] = useState({
    account_holder_name: initialData?.account_holder_name || '',
    account_number: initialData?.account_number || '',
    IFSC_code: initialData?.IFSC_code || '',
    account_type: initialData?.account_type || '',
    account_name: initialData?.account_name || '', // Changed from bank_name to account_name
    panCard: initialData?.panCard || '',
    aadharNumber: initialData?.aadharNumber || '',
  });

  const [idProofImage, setIdProofImage] = useState<File | null>(null);
  const [bankProofImage, setBankProofImage] = useState<File | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string>(
    initialData?.id_proof_image ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.id_proof_image}` : ''
  );
  const [bankProofPreview, setBankProofPreview] = useState<string>(
    initialData?.bank_proof_image ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.bank_proof_image}` : ''
  );

  const [originalForm] = useState(form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAccountTypeChange = (value: string) => {
    setForm(prev => ({ ...prev, account_type: value }));
    setErrors(prev => ({ ...prev, account_type: '' }));
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setIdProofImage(file);
      setIdProofPreview(URL.createObjectURL(file));
    }
  };

  const handleBankProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setBankProofImage(file);
      setBankProofPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadharRegex = /^\d{12}$/;

    if (form.account_number && !/^\d{9,18}$/.test(form.account_number)) {
      newErrors.account_number = 'Invalid account number';
    }
    if (form.IFSC_code && !ifscRegex.test(form.IFSC_code)) {
      newErrors.IFSC_code = 'Invalid IFSC code';
    }
    if (form.panCard && !panRegex.test(form.panCard.toUpperCase())) {
      newErrors.panCard = 'Invalid PAN card';
    }
    if (form.aadharNumber && !aadharRegex.test(form.aadharNumber)) {
      newErrors.aadharNumber = 'Invalid Aadhar number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getChangedFields = () => {
    const changed: Record<string, any> = {};
    Object.keys(form).forEach(key => {
      if (form[key as keyof typeof form] !== originalForm[key as keyof typeof originalForm]) {
        changed[key] = form[key as keyof typeof form];
      }
    });
    return changed;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const changedFields = getChangedFields();
    if (Object.keys(changedFields).length === 0 && !idProofImage && !bankProofImage) {
      toast.info('No changes to update');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('astrologerId', astrologerId);

      // Add all existing fields
      formData.append('astrologerName', initialData?.astrologerName || '');
      formData.append('displayName', initialData?.displayName || '');
      formData.append('title', initialData?.title || '');
      formData.append('email', initialData?.email || '');
      formData.append('phoneNumber', initialData?.phoneNumber || '');
      formData.append('alternateNumber', initialData?.alternateNumber || '');
      formData.append('country_phone_code', initialData?.country_phone_code || '91');
      formData.append('gender', initialData?.gender || '');
      formData.append('dateOfBirth', initialData?.dateOfBirth || '');
      formData.append('address', initialData?.address || '');
      formData.append('country', initialData?.country || 'India');
      formData.append('state', initialData?.state || '');
      formData.append('city', initialData?.city || '');
      formData.append('zipCode', initialData?.zipCode || '');
      formData.append('password', initialData?.password || '');
      formData.append('confirm_password', initialData?.confirm_password || initialData?.password || '');
      formData.append('experience', initialData?.experience || '');
      formData.append('about', initialData?.about || '');
      formData.append('short_bio', initialData?.short_bio || '');
      formData.append('long_bio', initialData?.long_bio || '');
      formData.append('youtubeLink', initialData?.youtubeLink || '');
      formData.append('tagLine', initialData?.tagLine || '');
      formData.append('workingOnOtherApps', initialData?.workingOnOtherApps || 'No');
      formData.append('consultation', initialData?.consultation || '1000');
      formData.append('free_min', initialData?.free_min || '0');

      // Languages
      (initialData?.language || []).forEach((lang: string) => {
        formData.append('language', lang);
      });

      // Skills, expertise, remedies
      (initialData?.skill || []).forEach((s: any) => {
        formData.append('skill', s._id || s);
      });
      (initialData?.mainExpertise || []).forEach((e: any) => {
        formData.append('mainExpertise', e._id || e);
      });
      (initialData?.remedies || []).forEach((r: any) => {
        formData.append('remedies', r._id || r);
      });

      // Bank details (updated from form)
      formData.append('account_holder_name', form.account_holder_name);
      formData.append('account_number', form.account_number);
      formData.append('account_type', form.account_type);
      formData.append('IFSC_code', form.IFSC_code);
      formData.append('account_name', form.account_name); // Changed from bank_name to account_name
      formData.append('panCard', form.panCard);
      formData.append('aadharNumber', form.aadharNumber);

      // Proof images
      if (idProofImage) {
        formData.append('id_proof_image', idProofImage);
      }
      if (bankProofImage) {
        formData.append('bank_proof_image', bankProofImage);
      }

      // Pricing
      formData.append('chat_price', initialData?.chat_price || '');
      formData.append('call_price', initialData?.call_price || '');
      formData.append('video_call_price', initialData?.video_call_price || '0');
      formData.append('normal_video_call_price', initialData?.normal_video_call_price || '0');
      formData.append('consultation_commission', initialData?.consultation_commission || '0');
      formData.append('commission_call_price', initialData?.commission_call_price || '0');
      formData.append('commission_chat_price', initialData?.commission_chat_price || '0');
      formData.append('commission_video_call_price', initialData?.commission_video_call_price || '0');
      formData.append('commission_normal_video_call_price', initialData?.commission_normal_video_call_price || '0');
      formData.append('gift_commission', initialData?.gift_commission || '0');
      formData.append('follower_count', initialData?.follower_count || '0');
      formData.append('totalCallDuration', initialData?.totalCallDuration || '0');
      formData.append('totalChatDuration', initialData?.totalChatDuration || '0');
      formData.append('totalVideoCallDuration', initialData?.totalVideoCallDuration || '0');
      formData.append('currency', initialData?.currency || 'INR');
      formData.append('isDealInReport', initialData?.isDealInReport || 'false');

      (initialData?.reportTypes || []).forEach((rt: string) => {
        formData.append('reportTypes', rt);
      });

      const response = await fetch(
        `/api/admin/update-astrologer`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Bank details updated successfully');
        setIdProofImage(null);
        setBankProofImage(null);
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b">
            Bank Account Information
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name
          </label>
          <input
            type="text"
            name="account_holder_name"
            value={form.account_holder_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number
          </label>
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.account_number ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.account_number && (
            <p className="text-red-600 text-sm mt-1">{errors.account_number}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code
          </label>
          <input
            type="text"
            name="IFSC_code"
            value={form.IFSC_code}
            onChange={handleChange}
            placeholder="e.g., SBIN0001234"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase ${
              errors.IFSC_code ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.IFSC_code && (
            <p className="text-red-600 text-sm mt-1">{errors.IFSC_code}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="account_type"
                value="Savings"
                checked={form.account_type === 'Savings'}
                onChange={(e) => handleAccountTypeChange(e.target.value)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Savings</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="account_type"
                value="Current"
                checked={form.account_type === 'Current'}
                onChange={(e) => handleAccountTypeChange(e.target.value)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Current</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            name="account_name" // Changed from bank_name to account_name
            value={form.account_name} // Changed from bank_name to account_name
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="md:col-span-2 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            KYC Documents
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Card Number
          </label>
          <input
            type="text"
            name="panCard"
            value={form.panCard}
            onChange={handleChange}
            placeholder="ABCDE1234F"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase ${
              errors.panCard ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.panCard && (
            <p className="text-red-600 text-sm mt-1">{errors.panCard}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhar Number
          </label>
          <input
            type="text"
            name="aadharNumber"
            value={form.aadharNumber}
            onChange={handleChange}
            placeholder="123456789012"
            maxLength={12}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.aadharNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.aadharNumber && (
            <p className="text-red-600 text-sm mt-1">{errors.aadharNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Proof (Aadhar/PAN/DL)
          </label>
          <div className="space-y-3">
            {idProofPreview && (
              <div className="relative inline-block">
                <img
                  src={idProofPreview}
                  alt="ID Proof"
                  className="h-32 w-auto rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIdProofImage(null);
                    setIdProofPreview(initialData?.id_proof_image ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.id_proof_image}` : '');
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="cursor-pointer block">
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Upload ID Proof</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleIdProofChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500">Max 5MB, JPG/PNG</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Proof (Passbook/Cheque)
          </label>
          <div className="space-y-3">
            {bankProofPreview && (
              <div className="relative inline-block">
                <img
                  src={bankProofPreview}
                  alt="Bank Proof"
                  className="h-32 w-auto rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBankProofImage(null);
                    setBankProofPreview(initialData?.bank_proof_image ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.bank_proof_image}` : '');
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="cursor-pointer block">
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Upload Bank Proof</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBankProofChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500">Max 5MB, JPG/PNG</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Update Bank Details
            </>
          )}
        </button>
      </div>
    </div>
  );
}
