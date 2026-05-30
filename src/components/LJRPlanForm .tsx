'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface FormState {
  planId: string;
  title: string;
  priceOriginal: number | '';
  priceFinal: number | '';
  sortOrder: number | '';
  isActive: boolean;
  addons: {
    astroConsultation: {
      enabled: boolean;
      price: number | '';
      priceOriginal: number | '';
      label: string;
    };
    expressDelivery: {
      enabled: boolean;
      price: number | '';
      label: string;
    };
  };
}

const defaultForm: FormState = {
  planId: '',
  title: '',
  priceOriginal: '',
  priceFinal: '',
  sortOrder: '',
  isActive: true,
  addons: {
    astroConsultation: {
      enabled: false,
      price: '',
      priceOriginal: '',
      label: 'Astro Consultation',
    },
    expressDelivery: {
      enabled: false,
      price: '',
      label: 'Express Delivery',
    },
  },
};

const LJRPlanForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const params = useParams();
  const planId = params?.planId as string;

  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit mode — fetch existing plan
  useEffect(() => {
    if (!isEdit || !planId) return;
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`,
          { credentials: 'include' }
        );
        const data = await res.json();
        const plan = data.plans?.find((p: any) => p.planId === planId);
        if (plan) {
          setForm({
            planId: plan.planId,
            title: plan.title,
            priceOriginal: plan.priceOriginal,
            priceFinal: plan.priceFinal,
            sortOrder: plan.sortOrder,
            isActive: plan.isActive,
            addons: {
              astroConsultation: {
                enabled: plan.addons.astroConsultation.enabled,
                price: plan.addons.astroConsultation.price,
                priceOriginal: plan.addons.astroConsultation.priceOriginal,
                label: plan.addons.astroConsultation.label || 'Astro Consultation',
              },
              expressDelivery: {
                enabled: plan.addons.expressDelivery.enabled,
                price: plan.addons.expressDelivery.price,
                label: plan.addons.expressDelivery.label || 'Express Delivery',
              },
            },
          });
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [isEdit, planId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.planId.trim()) newErrors.planId = 'Plan ID is required';
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (form.priceOriginal === '' || Number(form.priceOriginal) <= 0)
      newErrors.priceOriginal = 'Original price is required';
    if (form.priceFinal === '' || Number(form.priceFinal) <= 0)
      newErrors.priceFinal = 'Final price is required';
    if (form.addons.astroConsultation.enabled) {
      if (form.addons.astroConsultation.price === '' || Number(form.addons.astroConsultation.price) <= 0)
        newErrors.astroPrice = 'Consultation price is required';
      if (form.addons.astroConsultation.priceOriginal === '' || Number(form.addons.astroConsultation.priceOriginal) <= 0)
        newErrors.astroPriceOriginal = 'Consultation original price is required';
    }
    if (form.addons.expressDelivery.enabled) {
      if (form.addons.expressDelivery.price === '' || Number(form.addons.expressDelivery.price) <= 0)
        newErrors.expressPrice = 'Express delivery price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${planId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`;

      const method = isEdit ? 'PUT' : 'POST';

      const body = isEdit
        ? {
          priceOriginal: Number(form.priceOriginal),
          priceFinal: Number(form.priceFinal),
          isActive: form.isActive,
          addons: {
            astroConsultation: {
              enabled: form.addons.astroConsultation.enabled,
              price: Number(form.addons.astroConsultation.price),
              priceOriginal: Number(form.addons.astroConsultation.priceOriginal),
              label: form.addons.astroConsultation.label,
            },
            expressDelivery: {
              enabled: form.addons.expressDelivery.enabled,
              price: Number(form.addons.expressDelivery.price),
              label: form.addons.expressDelivery.label,
            },
          },
        }
        : {
          planId: form.planId,
          title: form.title,
          priceOriginal: Number(form.priceOriginal),
          priceFinal: Number(form.priceFinal),
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
          addons: {
            astroConsultation: {
              enabled: form.addons.astroConsultation.enabled,
              price: Number(form.addons.astroConsultation.price),
              priceOriginal: Number(form.addons.astroConsultation.priceOriginal),
              label: form.addons.astroConsultation.label,
            },
            expressDelivery: {
              enabled: form.addons.expressDelivery.enabled,
              price: Number(form.addons.expressDelivery.price),
              label: form.addons.expressDelivery.label,
            },
          },
        };

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        await Swal.fire(
          'Saved!',
          isEdit ? 'Plan updated successfully.' : 'Plan created successfully.',
          'success'
        );
        router.push('/manage-report-pricing');
      } else {
        Swal.fire('Error', data.message || 'Something went wrong.', 'error');
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      Swal.fire('Error', 'Failed to save plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/manage-report-pricing')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Plan' : 'Add New Plan'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Update pricing and add-on settings' : 'Create a new report plan'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Plan ID — only in add mode */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.planId}
                  onChange={(e) => setForm(prev => ({ ...prev, planId: e.target.value }))}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.planId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g. journey-report"
                />
                {errors.planId && <p className="text-red-500 text-xs mt-1">{errors.planId}</p>}
              </div>
            )}

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g. Life Journey Report"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
            )}

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setForm(prev => ({ ...prev, sortOrder: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  placeholder="1"
                  min="0"
                />
              </div>
            )}

            {isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan ID
                </label>
                <input
                  type="text"
                  value={form.planId}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Plan ID cannot be changed</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Base Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Original Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.priceOriginal}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  priceOriginal: e.target.value === '' ? '' : Number(e.target.value)
                }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.priceOriginal ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="e.g. 1996"
                min="0"
              />
              {errors.priceOriginal && (
                <p className="text-red-500 text-xs mt-1">{errors.priceOriginal}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Final Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.priceFinal}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  priceFinal: e.target.value === '' ? '' : Number(e.target.value)
                }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.priceFinal ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="e.g. 996"
                min="0"
              />
              {errors.priceFinal && (
                <p className="text-red-500 text-xs mt-1">{errors.priceFinal}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          {form.priceOriginal !== '' && form.priceFinal !== '' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <span className="text-gray-400 line-through text-sm">
                ₹{Number(form.priceOriginal).toLocaleString('en-IN')}
              </span>
              <span className="text-xl font-bold text-red-600">
                ₹{Number(form.priceFinal).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                {Math.round(((Number(form.priceOriginal) - Number(form.priceFinal)) / Number(form.priceOriginal)) * 100)}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Add-ons</h2>
          <div className="space-y-4">

            {/* Astro Consultation */}
            <div className={`border-2 rounded-xl p-4 transition-all ${form.addons.astroConsultation.enabled
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-gray-50'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">Astro Consultation</p>
                  <p className="text-xs text-gray-500">Enable for 1-on-1 consultation add-on</p>
                </div>
                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    addons: {
                      ...prev.addons,
                      astroConsultation: {
                        ...prev.addons.astroConsultation,
                        enabled: !prev.addons.astroConsultation.enabled
                      }
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.addons.astroConsultation.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.addons.astroConsultation.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {form.addons.astroConsultation.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Original Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.addons.astroConsultation.priceOriginal}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        addons: {
                          ...prev.addons,
                          astroConsultation: {
                            ...prev.addons.astroConsultation,
                            priceOriginal: e.target.value === '' ? '' : Number(e.target.value)
                          }
                        }
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.astroPriceOriginal ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="e.g. 5100"
                      min="0"
                    />
                    {errors.astroPriceOriginal && (
                      <p className="text-red-500 text-xs mt-1">{errors.astroPriceOriginal}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Final Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.addons.astroConsultation.price}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        addons: {
                          ...prev.addons,
                          astroConsultation: {
                            ...prev.addons.astroConsultation,
                            price: e.target.value === '' ? '' : Number(e.target.value)
                          }
                        }
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.astroPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="e.g. 904"
                      min="0"
                    />
                    {errors.astroPrice && (
                      <p className="text-red-500 text-xs mt-1">{errors.astroPrice}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Express Delivery */}
            <div className={`border-2 rounded-xl p-4 transition-all ${form.addons.expressDelivery.enabled
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-gray-50'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-medium text-gray-800 text-sm">Express Delivery</p>
                  <p className="text-xs text-gray-500">Enable for priority delivery add-on</p>
                </div>
                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    addons: {
                      ...prev.addons,
                      expressDelivery: {
                        ...prev.addons.expressDelivery,
                        enabled: !prev.addons.expressDelivery.enabled
                      }
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.addons.expressDelivery.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.addons.expressDelivery.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {form.addons.expressDelivery.enabled && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Add-on Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.addons.expressDelivery.price}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      addons: {
                        ...prev.addons,
                        expressDelivery: {
                          ...prev.addons.expressDelivery,
                          price: e.target.value === '' ? '' : Number(e.target.value)
                        }
                      }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${errors.expressPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="e.g. 149"
                    min="0"
                  />
                  {errors.expressPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.expressPrice}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">Plan Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.isActive ? 'Plan is visible to users' : 'Plan is hidden from users'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.push('/manage-report-pricing')}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-60"
          >
            {saving
              ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
              : <><Save className="w-4 h-4" /> {isEdit ? 'Update Plan' : 'Create Plan'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default LJRPlanForm;