// components/astrologer/FirstTimeOfferManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, Plus, Trash2, Clock, Save, Tag, Info } from 'lucide-react';

interface SlotDuration {
  _id: string;
  slotDuration: number;
  active: boolean;
}

interface FirstTimeOfferPrice {
  _id?: string;
  duration: {
    _id: string;
    slotDuration: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  price: number;
}

interface FirstTimeOfferManagementProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function FirstTimeOfferManagement({ 
  astrologerId, 
  initialData, 
  onUpdate 
}: FirstTimeOfferManagementProps) {
  // State for pricing mode - 'global' or 'custom'
  const [pricingMode, setPricingMode] = useState<'global' | 'custom'>('global');

  // State for custom prices
  const [existingOfferPrices, setExistingOfferPrices] = useState<FirstTimeOfferPrice[]>([]);
  const [newOfferPrice, setNewOfferPrice] = useState<{ durationId: string; price: string }>({
    durationId: '',
    price: ''
  });

  const [allSlotDurations, setAllSlotDurations] = useState<SlotDuration[]>([]);
  const [globalOfferPrice, setGlobalOfferPrice] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingPrice, setAddingPrice] = useState(false);

  // -------------------- Load Data --------------------
  useEffect(() => {
    fetchSlotDurations();
    loadExistingOfferPrices();
    fetchGlobalOfferPrice();
  }, []);

  const fetchGlobalOfferPrice = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-offer-price`
      );
      const data = await response.json();
      if (data.success && data.data) {
        setGlobalOfferPrice(data.data.OfferPrice);
      }
    } catch (error) {
      console.error('Error fetching global offer price:', error);
    }
  };

  const loadExistingOfferPrices = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get-first-time-offer/${astrologerId}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setExistingOfferPrices(data.data.firstTimeOfferPrices || []);
        
        // Set pricing mode based on data
        if (data.data.GoWithCustomPricings) {
          setPricingMode('custom');
        } else {
          setPricingMode('global');
        }
      }
    } catch (error) {
      console.error('Error loading offer prices:', error);
    }
  };

  const fetchSlotDurations = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/admin/get_slots_duration`
      );
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

  // -------------------- Helpers --------------------
  const getAvailableSlots = (): SlotDuration[] => {
    const usedDurationIds = existingOfferPrices.map(p => p.duration._id);
    return allSlotDurations.filter(s => !usedDurationIds.includes(s._id));
  };

  // -------------------- Save Pricing Mode --------------------
  const handleSavePricingMode = async () => {
    setSubmitting(true);
    try {
      const payload = {
        useGlobalFirstTimeOfferPrice: pricingMode === 'global',
        GoWithCustomPricings: pricingMode === 'custom',
        ...(pricingMode === 'global' && { firstTimeOfferPrices: [] })
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/update-first-time-offer/${astrologerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        if (pricingMode === 'global') {
          setExistingOfferPrices([]);
        }
        toast.success(`Switched to ${pricingMode} pricing successfully`);
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

  // -------------------- Add/Delete Prices --------------------
  const handleAddOfferPrice = async () => {
    if (!newOfferPrice.durationId) {
      toast.error('Please select a duration');
      return;
    }

    if (!newOfferPrice.price || Number(newOfferPrice.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setAddingPrice(true);

    try {
      const existingPrices = existingOfferPrices.map(p => ({
        duration: p.duration._id,
        price: p.price
      }));

      const updatedPrices = [
        ...existingPrices,
        { duration: newOfferPrice.durationId, price: Number(newOfferPrice.price) }
      ];

      // Auto-save: Switch to custom pricing when adding price
      const payload = {
        GoWithCustomPricings: true,
        useGlobalFirstTimeOfferPrice: false,
        firstTimeOfferPrices: updatedPrices
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/update-first-time-offer/${astrologerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        setPricingMode('custom'); // Auto-switch to custom
        toast.success('First-time offer price added successfully');
        setNewOfferPrice({ durationId: '', price: '' });
        loadExistingOfferPrices();
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to add price');
      }
    } catch (error) {
      console.error('Error adding offer price:', error);
      toast.error('Network error occurred');
    } finally {
      setAddingPrice(false);
    }
  };

  const handleDeleteOfferPrice = async (durationId: string) => {
    setSubmitting(true);
    try {
      const updatedPrices = existingOfferPrices
        .filter(p => p.duration._id !== durationId)
        .map(p => ({
          duration: p.duration._id,
          price: p.price
        }));

      const payload = {
        GoWithCustomPricings: updatedPrices.length > 0,
        useGlobalFirstTimeOfferPrice: updatedPrices.length === 0,
        firstTimeOfferPrices: updatedPrices
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/update-first-time-offer/${astrologerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        if (updatedPrices.length === 0) {
          setPricingMode('global'); // Auto-switch to global if no prices left
        }
        toast.success('First-time offer price deleted successfully');
        loadExistingOfferPrices();
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to delete price');
      }
    } catch (error) {
      console.error('Error deleting offer price:', error);
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = getAvailableSlots();
  const minPrice = existingOfferPrices.length > 0 
    ? Math.min(...existingOfferPrices.map(p => p.price)) 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">First-Time Customer Offer Pricing</h2>
        <p className="text-gray-600 text-sm">Set special pricing for new customers only</p>
      </div>

      {/* Main Card - Compact Layout */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        
        {/* Pricing Mode Selection - Flexible Grid */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Radio Options Container */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Global Pricing Radio */}
            <label className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-red-50 ${pricingMode === 'global' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="pricingMode"
                value="global"
                checked={pricingMode === 'global'}
                onChange={(e) => setPricingMode('global')}
                className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm mb-0.5">Global Pricing</div>
                <div className="text-xs text-red-600 font-bold">₹{globalOfferPrice || 'Not Set'}</div>
                <div className="text-xs text-gray-500 mt-0.5">Platform default (15 min)</div>
              </div>
            </label>

            {/* Custom Pricing Radio */}
            <label className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-red-50 ${pricingMode === 'custom' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="pricingMode"
                value="custom"
                checked={pricingMode === 'custom'}
                onChange={(e) => setPricingMode('custom')}
                className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm mb-0.5">Custom Pricing</div>
                <div className="text-xs text-red-600 font-bold">
                  {existingOfferPrices.length > 0 ? `${existingOfferPrices.length} price(s)` : 'Not Set'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Set custom prices</div>
              </div>
            </label>
          </div>

          {/* Save Button - Smaller and Aligned */}
          <div className="md:w-40 h-full flex justify-center items-center">
            <button
              type="button"
              onClick={handleSavePricingMode}
              disabled={submitting}
              className="w-full  px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Prices Section */}
      {pricingMode === 'custom' && (
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Custom First-Time Prices</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Set special prices for new customers
              </p>
            </div>
          </div>

          {loadingSlots ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-200 border-t-red-500 mx-auto"></div>
              <p className="text-gray-500 text-xs mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {/* Existing Prices */}
              {existingOfferPrices.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {existingOfferPrices.map((price) => (
                      <div
                        key={price._id || price.duration._id}
                        className="flex items-center justify-between bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 text-sm">
                              {price.duration.slotDuration}min
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="font-bold text-red-600 text-sm">
                              ₹{price.price}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteOfferPrice(price.duration._id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Min Price Display */}
                  {minPrice && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-green-800">
                        Minimum first-time price: <span className="font-bold">₹{minPrice}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Add New Price Form */}
              {availableSlots.length > 0 ? (
                <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Add New First-Time Price
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={newOfferPrice.durationId}
                      onChange={(e) =>
                        setNewOfferPrice({ ...newOfferPrice, durationId: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="">Select Duration</option>
                      {availableSlots.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                          {slot.slotDuration} minutes
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={newOfferPrice.price}
                      onChange={(e) =>
                        setNewOfferPrice({ ...newOfferPrice, price: e.target.value })
                      }
                      placeholder="Enter price"
                      min="0"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleAddOfferPrice}
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
                          Add Price
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-100 rounded-lg border border-red-200">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <p className="text-gray-700 font-medium text-sm">
                    All durations have prices
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Delete a price to add a different one
                  </p>
                </div>
              )}

              {existingOfferPrices.length === 0 && availableSlots.length > 0 && (
                <div className="text-center py-4 bg-gray-100 rounded-lg border border-red-200 mb-3">
                  <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No custom prices set yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Add your first custom price using the form above
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
