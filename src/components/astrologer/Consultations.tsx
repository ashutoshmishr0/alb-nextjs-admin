// components/astrologer/Consultations.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, Plus, Trash2, Clock, Save } from 'lucide-react';

interface SlotDuration {
  _id: string;
  slotDuration: number;
  active: boolean;
}

interface ConsultationPrice {
  _id?: string;
  duration: string; // durationId
  price: number;
}

interface SpecialPricingRate {
  duration: number; // minutes (5, 15, 30, 45, ...)
  price: number;
}

interface ConsultationsProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function Consultations({ astrologerId, initialData, onUpdate }: ConsultationsProps) {
  const [totalConsultations, setTotalConsultations] = useState(initialData?.consultation || '0');
  const [consultationCommission, setConsultationCommission] = useState(initialData?.consultation_commission || '0');
  const [isSpecialAstrologer, setIsSpecialAstrologer] = useState(initialData?.hasSpecialPricing || false);
  const [specialPricingRates, setSpecialPricingRates] = useState<SpecialPricingRate[]>([]);
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.original_price !== undefined && initialData?.original_price !== null
      ? String(initialData.original_price)
      : ''
  );
  const [existingPrices, setExistingPrices] = useState<ConsultationPrice[]>([]);
  const [newPrice, setNewPrice] = useState<{ durationId: string; price: string }>({
    durationId: '',
    price: ''
  });
  const [allSlotDurations, setAllSlotDurations] = useState<SlotDuration[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingPrice, setAddingPrice] = useState(false);

  // -------------------- load data --------------------
  useEffect(() => {
    fetchSlotDurations();
    loadExistingPrices();
  }, []);

  useEffect(() => {
    loadSpecialPricing();
  }, [initialData?.specialPricingRates, allSlotDurations.length]);

  const loadExistingPrices = () => {
    const prices = initialData?.consultationPrices || [];
    setExistingPrices(prices);
  };

  const fetchSlotDurations = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/admin/get_slots_duration`);
      const data = await response.json();
      if (data.success) {
        const slots = data.slots || [];
        const activeSlots = slots.filter((s: SlotDuration) => s.active);
        setAllSlotDurations(activeSlots);
      }
    } catch (error) {
      console.error('Error fetching slot durations:', error);
      toast.error('Failed to load slot durations');
    } finally {
      setLoadingSlots(false);
    }
  };

  // specialPricingRates in DB is Map<minutes, price>. We keep it as minutes in state.
  const loadSpecialPricing = () => {
    if (!initialData?.specialPricingRates) {
      setSpecialPricingRates([]);
      return;
    }

    const rates: SpecialPricingRate[] = Object.entries(initialData.specialPricingRates).map(
      ([minutesStr, price]) => ({
        duration: Number(minutesStr),
        price: Number(price),
      })
    );
    setSpecialPricingRates(rates);
  };

  // -------------------- helpers --------------------
  const getSlotDuration = (durationId: string | undefined): SlotDuration | undefined => {
    if (!durationId) return undefined;
    return allSlotDurations.find(s => s._id === durationId);
  };

  const getAvailableSlots = (): SlotDuration[] => {
    const usedDurationIds = existingPrices.map(p => p.duration);
    return allSlotDurations.filter(s => !usedDurationIds.includes(s._id));
  };

  const getMinutesByDurationId = (durationId: string): number | undefined => {
    const s = allSlotDurations.find(slot => slot._id === durationId);
    return s?.slotDuration;
  };

  const getSlotByMinutes = (minutes: number): SlotDuration | undefined =>
    allSlotDurations.find(s => s.slotDuration === minutes);

  const getNormalDurationsInMinutes = (): number[] => {
    return existingPrices
      .map(p => getMinutesByDurationId(p.duration))
      .filter((m): m is number => m !== undefined);
  };

  function getMinPrice(prices: ConsultationPrice[]): number {
    const valid = prices.map(p => p.price);
    if (valid.length === 0) return 0;
    return Math.min(...valid);
  }

  function getNextMinPrice(prices: ConsultationPrice[]): number {
    const valid = prices.map(p => p.price).sort((a, b) => a - b);
    if (valid.length <= 1) return 0;
    return valid[1];
  }

  function isMinPrice(durationId: string, prices: ConsultationPrice[]): boolean {
    const priceToDelete = prices.find(p => p.duration === durationId);
    if (!priceToDelete) return false;
    const minPrice = getMinPrice(prices);
    return priceToDelete.price === minPrice;
  }

  const isSaveDisabled = (): boolean => {
    const actualShownPrice = getMinPrice(initialData?.consultationPrices || []);
    const enteredOriginalPrice = Number(originalPrice);

    if (originalPrice !== '' && enteredOriginalPrice < actualShownPrice + 1) {
      return true;
    }

    return submitting;
  };

  // -------------------- normal prices --------------------
  const handleAddPrice = async () => {
    if (!newPrice.durationId) {
      toast.error('Please select a duration');
      return;
    }

    if (!newPrice.price || Number(newPrice.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setAddingPrice(true);

    try {
      const response = await fetch(
        `/api/admin/consultation-price`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            astrologerId,
            durationId: newPrice.durationId,
            price: Number(newPrice.price)
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Consultation price added successfully');
        setNewPrice({ durationId: '', price: '' });
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to add price');
      }
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error('Network error occurred');
    } finally {
      setAddingPrice(false);
    }
  };

  const handleDeletePrice = async (durationId: string) => {
    try {
      const isDeletingMinPrice = isMinPrice(durationId, existingPrices);

      const response = await fetch(
        `/api/admin/delete-consultation-price`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            astrologerId,
            durationId
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Consultation price deleted successfully');

        if (isDeletingMinPrice && existingPrices.length > 1) {
          const nextMinPrice = getNextMinPrice(existingPrices);
          const newOriginalPrice = nextMinPrice + 1000;
          await updateOriginalPriceAfterDelete(newOriginalPrice);
        }

        onUpdate();
      } else {
        toast.error(data.message || 'Failed to delete price');
      }
    } catch (error) {
      console.error('Error deleting price:', error);
      toast.error('Network error occurred');
    }
  };

  const updateOriginalPriceAfterDelete = async (newOriginalPrice: number) => {
    try {
      const payload: any = {
        astrologerId,
        astrologerName: initialData?.astrologerName || '',
        displayName: initialData?.displayName || '',
        title: initialData?.title || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        alternateNumber: initialData?.alternateNumber || '',
        country_phone_code: initialData?.country_phone_code || '91',
        gender: initialData?.gender || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        address: initialData?.address || '',
        country: initialData?.country || 'India',
        state: initialData?.state || '',
        city: initialData?.city || '',
        zipCode: initialData?.zipCode || '',
        password: initialData?.password || '',
        confirm_password: initialData?.confirm_password || initialData?.password || '',

        experience: initialData?.experience || '',
        about: initialData?.about || '',
        short_bio: initialData?.short_bio || '',
        long_bio: initialData?.long_bio || '',
        youtubeLink: initialData?.youtubeLink || '',
        tagLine: initialData?.tagLine || '',
        language: initialData?.language || [],
        workingOnOtherApps: initialData?.workingOnOtherApps || 'No',

        skill: initialData?.skill?.map((s: any) => s._id) || [],
        mainExpertise: initialData?.mainExpertise?.map((e: any) => e._id) || [],
        remedies: initialData?.remedies?.map((r: any) => r._id) || [],

        account_holder_name: initialData?.account_holder_name || '',
        account_number: initialData?.account_number || '',
        account_type: initialData?.account_type || '',
        IFSC_code: initialData?.IFSC_code || '',
        account_name: initialData?.account_name || '',
        panCard: initialData?.panCard || '',
        aadharNumber: initialData?.aadharNumber || '',

        consultation: totalConsultations,
        consultation_commission: consultationCommission,
        original_price: newOriginalPrice,

        free_min: initialData?.free_min || 0,
        chat_price: initialData?.chat_price || null,
        call_price: initialData?.call_price || null,
        video_call_price: initialData?.video_call_price || 0,
        normal_video_call_price: initialData?.normal_video_call_price || 0,
        commission_call_price: initialData?.commission_call_price || '0',
        commission_chat_price: initialData?.commission_chat_price || '0',
        commission_video_call_price: initialData?.commission_video_call_price || 0,
        commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
        gift_commission: initialData?.gift_commission || 0,

        follower_count: initialData?.follower_count || 0,
        totalCallDuration: initialData?.totalCallDuration || 0,
        totalChatDuration: initialData?.totalChatDuration || 0,
        totalVideoCallDuration: initialData?.totalVideoCallDuration || 0,
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

      const responseData = await response.json();

      if (responseData.success) {
        toast.success(`Original price automatically updated to ₹${newOriginalPrice}`);
        setOriginalPrice(String(newOriginalPrice));
      }
    } catch (error) {
      console.error('Error updating original price:', error);
      toast.error('Failed to update original price automatically');
    }
  };

  // -------------------- special pricing --------------------
  const getAvailableDurationsForSpecialPricing = (currentDuration: number): number[] => {
    const normalDurations = getNormalDurationsInMinutes();
    const usedDurations = specialPricingRates
      .map(r => r.duration)
      .filter(d => d !== currentDuration);

    return normalDurations.filter(d => !usedDurations.includes(d));
  };

  const handleAddSpecialPrice = () => {
    const normalDurations = getNormalDurationsInMinutes();
    const alreadyUsed = specialPricingRates.map(r => r.duration);
    const available = normalDurations.filter(m => !alreadyUsed.includes(m));

    if (available.length === 0) {
      toast.info('All durations already have special pricing');
      return;
    }

    setSpecialPricingRates(prev => [...prev, { duration: available[0], price: 0 }]);
  };

  const handleRemoveSpecialPrice = (index: number) => {
    setSpecialPricingRates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecialPriceChange = (
    index: number,
    field: 'duration' | 'price',
    value: number
  ) => {
    setSpecialPricingRates(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // -------------------- save basic + specials --------------------
  const handleUpdateBasicInfo = async () => {
    setSubmitting(true);

    try {
      const payload: any = {
        astrologerId,
        astrologerName: initialData?.astrologerName || '',
        displayName: initialData?.displayName || '',
        title: initialData?.title || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        alternateNumber: initialData?.alternateNumber || '',
        country_phone_code: initialData?.country_phone_code || '91',
        gender: initialData?.gender || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        address: initialData?.address || '',
        country: initialData?.country || 'India',
        state: initialData?.state || '',
        city: initialData?.city || '',
        zipCode: initialData?.zipCode || '',
        password: initialData?.password || '',
        confirm_password: initialData?.confirm_password || initialData?.password || '',

        experience: initialData?.experience || '',
        about: initialData?.about || '',
        short_bio: initialData?.short_bio || '',
        long_bio: initialData?.long_bio || '',
        youtubeLink: initialData?.youtubeLink || '',
        tagLine: initialData?.tagLine || '',
        language: initialData?.language || [],
        workingOnOtherApps: initialData?.workingOnOtherApps || 'No',

        skill: initialData?.skill?.map((s: any) => s._id) || [],
        mainExpertise: initialData?.mainExpertise?.map((e: any) => e._id) || [],
        remedies: initialData?.remedies?.map((r: any) => r._id) || [],

        account_holder_name: initialData?.account_holder_name || '',
        account_number: initialData?.account_number || '',
        account_type: initialData?.account_type || '',
        IFSC_code: initialData?.IFSC_code || '',
        account_name: initialData?.account_name || '',
        panCard: initialData?.panCard || '',
        aadharNumber: initialData?.aadharNumber || '',

        consultation: totalConsultations,
        consultation_commission: consultationCommission,

        free_min: initialData?.free_min || 0,
        chat_price: initialData?.chat_price || null,
        call_price: initialData?.call_price || null,
        video_call_price: initialData?.video_call_price || 0,
        normal_video_call_price: initialData?.normal_video_call_price || 0,
        commission_call_price: initialData?.commission_call_price || '0',
        commission_chat_price: initialData?.commission_chat_price || '0',
        commission_video_call_price: initialData?.commission_video_call_price || 0,
        commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
        gift_commission: initialData?.gift_commission || 0,

        follower_count: initialData?.follower_count || 0,
        totalCallDuration: initialData?.totalCallDuration || 0,
        totalChatDuration: initialData?.totalChatDuration || 0,
        totalVideoCallDuration: initialData?.totalVideoCallDuration || 0,
        currency: initialData?.currency || 'INR',

        isDealInReport: initialData?.isDealInReport || false,
        reportTypes: initialData?.reportTypes || [],
        hasSpecialPricing: isSpecialAstrologer,
      };

      // store specials as { [minutes]: price }
      if (isSpecialAstrologer && specialPricingRates.length > 0) {
        payload.specialPricingRates = Object.fromEntries(
          specialPricingRates.map(r => [String(r.duration), r.price])
        );
      } else {
        payload.specialPricingRates = {};
      }

      if (originalPrice !== '') {
        payload.original_price = Number(originalPrice);
      }

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
        toast.success('Consultation settings updated successfully');
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

  const availableSlots = getAvailableSlots();
  const actualShownPrice = getMinPrice(initialData?.consultationPrices || []);
  const enteredOriginalPrice = Number(originalPrice);
  const showValidationError = originalPrice !== '' && enteredOriginalPrice < actualShownPrice;

  // when toggling ON, auto-add first available duration row
  const handleToggleSpecialPricing = (checked: boolean) => {
    setIsSpecialAstrologer(checked);

    if (!checked) {
      setSpecialPricingRates([]);
      return;
    }

    const normalDurations = getNormalDurationsInMinutes();
    if (normalDurations.length === 0) {
      setSpecialPricingRates([]);
      return;
    }

    if (specialPricingRates.length === 0) {
      setSpecialPricingRates([{ duration: normalDurations[0], price: 0 }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Consultation Settings</h2>
        <p className="text-gray-600 text-sm">Manage consultation pricing, commission and special pricing</p>
      </div>

      {/* Main card wrapping everything for consistent layout */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-6">
        {/* Basic info row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Total Consultations
            </label>
            <input
              type="number"
              value={totalConsultations}
              onChange={(e) => setTotalConsultations(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Commission (%)
            </label>
            <input
              type="number"
              value={consultationCommission}
              onChange={(e) => setConsultationCommission(e.target.value)}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Original Price (₹)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                showValidationError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Actual Shown Price (₹)
            </label>
            <input
              type="number"
              disabled
              value={actualShownPrice}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-gray-100"
            />
          </div>
          {astrologerId !== "68b546bad26a07574a62453d" &&
        <div className=" w-full">
          <button
            type="button"
            onClick={handleUpdateBasicInfo}
            disabled={isSaveDisabled()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-[2px] font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>}
        </div>

        {/* Normal prices section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Consultation Prices by Duration</h3>
              <p className="text-xs text-gray-600 mt-0.5">Add prices for different consultation durations</p>
            </div>
          </div>

          {loadingSlots ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-200 border-t-red-500 mx-auto"></div>
              <p className="text-gray-500 text-xs mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {existingPrices.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {existingPrices.map((price) => {
                      const slot = getSlotDuration(price.duration);
                      return (
                        <div
                          key={price._id || price.duration}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 text-sm">
                                {slot?.slotDuration}min
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="font-bold text-red-600 text-sm">₹{price.price}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePrice(price.duration)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableSlots.length > 0 ? (
                <div className="bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs font-medium text-gray-700 mb-2">Add New Price</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={newPrice.durationId}
                      onChange={(e) => setNewPrice({ ...newPrice, durationId: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="">Select Duration</option>
                      {availableSlots.map(slot => (
                        <option key={slot._id} value={slot._id}>
                          {slot.slotDuration} minutes
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={newPrice.price}
                      onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                      placeholder="Enter price"
                      min="0"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleAddPrice}
                      disabled={addingPrice}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-[2px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {addingPrice ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <p className="text-gray-700 font-medium text-sm">All durations have prices</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Delete a price to add a different one
                  </p>
                </div>
              )}

              {existingPrices.length === 0 && availableSlots.length > 0 && (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No consultation prices set yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Add your first price using the form above
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Special pricing section - visually aligned */}
        {astrologerId === "68b546bad26a07574a62453d" &&
        <div className=" rounded-lg p-4 border border-red-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Special Pricing Configuration
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Set discounted prices for specific durations (Normal mode only)
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-red-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpecialAstrologer}
                onChange={(e) => handleToggleSpecialPricing(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded "
              />
              <div>
                <span className="font-semibold text-gray-900 text-sm">Enable Special Pricing</span>
                <p className="text-xs text-gray-600">
                  Astrologer will have discounted rates in Normal mode
                </p>
              </div>
            </label>
          </div>

          {isSpecialAstrologer && (
            <div className="space-y-3">
              {specialPricingRates.length > 0 && (
                <div className="space-y-2">
                  {specialPricingRates.map((rate, index) => {
                    const availableDurations = getAvailableDurationsForSpecialPricing(rate.duration);
                    const allDurations = [rate.duration, ...availableDurations]
                      .filter((v, i, arr) => arr.indexOf(v) === i)
                      .sort((a, b) => a - b);

                    return (
                      <div
                        key={rate.duration + '-' + index}
                        className="bg-white p-3 rounded-lg border border-red-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Duration (minutes)
                            </label>
                            <select
                              value={rate.duration}
                              onChange={(e) =>
                                handleSpecialPriceChange(index, 'duration', Number(e.target.value))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            >
                              {allDurations.map(duration => (
                                <option key={duration} value={duration}>
                                  {duration} minutes
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Special Price (₹)
                            </label>
                            <input
                              type="number"
                              value={rate.price}
                              onChange={(e) =>
                                handleSpecialPriceChange(index, 'price', Number(e.target.value))
                              }
                              placeholder="Enter special price"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialPrice(index)}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddSpecialPrice}
                disabled={
                  specialPricingRates.length >= getNormalDurationsInMinutes().length ||
                  getNormalDurationsInMinutes().length === 0
                }
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Special Price for Duration
              </button>
            </div>
          )}
        </div>
}
        {/* Save button at bottom for everything */}
        {astrologerId === "68b546bad26a07574a62453d" &&
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpdateBasicInfo}
            disabled={isSaveDisabled()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-[2px] font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>}
      </div>
    </div>
  );
}
