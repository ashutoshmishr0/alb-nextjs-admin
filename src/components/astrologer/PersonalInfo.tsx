// components/astrologer/PersonalInfo.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Country, State, City } from 'country-state-city';
import { calculateAge } from '@/utils/common-function';
import { Eye, EyeOff } from 'lucide-react';

interface PersonalInfoProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function PersonalInfo({ astrologerId, initialData, onUpdate }: PersonalInfoProps) {
  const [form, setForm] = useState({
    astrologerName: initialData?.astrologerName || '',
    displayName: initialData?.displayName || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    alternateNumber: initialData?.alternateNumber || '',
    country_phone_code: initialData?.country_phone_code || '91',
    gender: initialData?.gender || '',
    dateOfBirth: initialData?.dateOfBirth ? moment(initialData.dateOfBirth).format('YYYY-MM-DD') : '',
    address: initialData?.address || '',
    country: initialData?.country || 'India',
    state: initialData?.state || '',
    city: initialData?.city || '',
    zipCode: initialData?.zipCode || '',
    password: initialData?.password || '', // ✅ Pre-filled with existing password
    confirm_password: initialData?.password || '', // ✅ Pre-filled with existing password
  });

  const [originalForm] = useState(form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countries] = useState(Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  useEffect(() => {
    if (form.country) {
      const country = countries.find(c => c.name === form.country);
      if (country) {
        setSelectedCountry(country);
        setStates(State.getStatesOfCountry(country.isoCode));
      }
    }
  }, [form.country, countries]);

  useEffect(() => {
    if (form.state && selectedCountry) {
      const state = states.find(s => s.name === form.state);
      if (state) {
        setCities(City.getCitiesOfState(selectedCountry.isoCode, state.isoCode));
      }
    }
  }, [form.state, selectedCountry, states]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleGenderChange = (value: string) => {
    setForm(prev => ({ ...prev, gender: value }));
    setErrors(prev => ({ ...prev, gender: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;

    if (!form.astrologerName) newErrors.astrologerName = 'Name required';
    if (!emailRegex.test(form.email)) newErrors.email = 'Invalid email';
    if (!mobileRegex.test(form.phoneNumber)) newErrors.phoneNumber = '10-digit mobile required';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'DOB required';
    if (calculateAge(form.dateOfBirth) < 18) newErrors.dateOfBirth = 'Must be 18+';

    // Password validation
    if (form.password && form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes to update');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        astrologerId,
        astrologerName: form.astrologerName,
        displayName: form.displayName,
        title: initialData?.title || '',
        email: form.email,
        phoneNumber: form.phoneNumber,
        alternateNumber: form.alternateNumber,
        country_phone_code: form.country_phone_code,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        country: form.country,
        state: form.state,
        city: form.city,
        zipCode: form.zipCode,
        password: form.password,
        confirm_password: form.confirm_password,
        
        experience: initialData?.experience || '',
        about: initialData?.about || '',
        short_bio: initialData?.short_bio || '',
        long_bio: initialData?.long_bio || '',
        tagLine: initialData?.tagLine || '',
        youtubeLink: initialData?.youtubeLink || '',
        language: initialData?.language || [],
        skill: initialData?.skill?.map((s: any) => s._id) || [],
        mainExpertise: initialData?.mainExpertise?.map((e: any) => e._id) || [],
        remedies: initialData?.remedies?.map((r: any) => r._id) || [],
        expertise: initialData?.expertise || [],
        preferredDays: initialData?.preferredDays || [],
        
        account_holder_name: initialData?.account_holder_name || '',
        account_number: initialData?.account_number || '',
        account_type: initialData?.account_type || '',
        IFSC_code: initialData?.IFSC_code || '',
        account_name: initialData?.account_name || '',
        panCard: initialData?.panCard || '',
        aadharNumber: initialData?.aadharNumber || '',
        
        free_min: initialData?.free_min || 0,
        consultation: initialData?.consultation || '1000',
        chat_price: initialData?.chat_price || null,
        call_price: initialData?.call_price || null,
        video_call_price: initialData?.video_call_price || 0,
        normal_video_call_price: initialData?.normal_video_call_price || 0,
        
        consultation_commission: initialData?.consultation_commission || 0,
        commission_call_price: initialData?.commission_call_price || '0',
        commission_chat_price: initialData?.commission_chat_price || '0',
        commission_video_call_price: initialData?.commission_video_call_price || 0,
        commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
        consultation_call_price: initialData?.consultation_call_price || null,
        consultation_chat_price: initialData?.consultation_chat_price || null,
        consultation_videocall_price: initialData?.consultation_videocall_price || null,
        consultation_commission_call: initialData?.consultation_commission_call || null,
        consultation_commission_chat: initialData?.consultation_commission_chat || null,
        consultation_commission_videocall: initialData?.consultation_commission_videocall || null,
        gift_commission: initialData?.gift_commission || 0,
        
        follower_count: initialData?.follower_count || 0,
        totalCallDuration: initialData?.totalCallDuration || 0,
        totalChatDuration: initialData?.totalChatDuration || 0,
        totalVideoCallDuration: initialData?.totalVideoCallDuration || 0,
        workingOnOtherApps: initialData?.workingOnOtherApps || 'No',
        currency: initialData?.currency || 'INR',
        
        isDealInReport: initialData?.isDealInReport || false,
        reportTypes: initialData?.reportTypes || [],
      };

      const response = await fetch(
        `/api/admin/update-astrologer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Personal info updated successfully');
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
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="astrologerName"
            value={form.astrologerName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.astrologerName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.astrologerName && (
            <p className="text-red-600 text-sm mt-1">{errors.astrologerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alternate Number
          </label>
          <input
            type="text"
            name="alternateNumber"
            value={form.alternateNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={form.gender === 'Male'}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={form.gender === 'Female'}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Female</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Other"
                checked={form.gender === 'Other'}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Other</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {countries.map(c => (
              <option key={c.isoCode} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select State</option>
            {states.map(s => (
              <option key={s.isoCode} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select City</option>
            {cities.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pin Code
          </label>
          <input
            type="text"
            name="zipCode"
            value={form.zipCode}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Password Section */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            Password
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.confirm_password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-red-600 text-sm mt-1">{errors.confirm_password}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            'Update Personal Info'
          )}
        </button>
      </div>
    </div>
  );
}
