'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Addon {
  enabled: boolean;
  price: number;
  priceOriginal?: number;
  label: string;
}

interface Plan {
  _id: string;
  planId: string;
  title: string;
  priceOriginal: number;
  priceFinal: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  addons: {
    astroConsultation: Addon;
    expressDelivery: Addon;
  };
}

const LJRPlansList = () => {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`
      );
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (planId: string, currentStatus: boolean) => {
    const result = await Swal.fire({
      title: `${currentStatus ? 'Deactivate' : 'Activate'} Plan?`,
      text: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this plan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#d33' : '#22c55e',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: currentStatus ? 'Deactivate' : 'Activate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${planId}/toggle`,
        { method: 'PATCH' }
      );
      const data = await res.json();
      if (data.success) {
        setPlans(prev =>
          prev.map(p => p.planId === planId ? { ...p, isActive: data.isActive } : p)
        );
        Swal.fire('Done!', data.message, 'success');
      }
    } catch (err) {
      console.error('Error toggling plan:', err);
    }
  };

  const handleDelete = async (planId: string, title: string) => {
    const result = await Swal.fire({
      title: 'Deactivate Plan?',
      text: `"${title}" will be deactivated.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${planId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p.planId === planId ? { ...p, isActive: false } : p));
        Swal.fire('Done!', 'Plan deactivated successfully.', 'success');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Report Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage pricing and add-ons for all report plans
          </p>
        </div>
        <button
          onClick={() => router.push('/manage-report-pricing/add')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`bg-white rounded-xl border-2 shadow-sm p-5 flex flex-col gap-4 transition-all ${
              plan.isActive ? 'border-gray-200' : 'border-red-200 opacity-70'
            }`}
          >
            {/* Plan Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {plan.planId}
                </span>
                <h3 className="font-semibold text-gray-800 mt-1 text-sm leading-snug">
                  {plan.title}
                </h3>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                  plan.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Base Price</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 line-through text-sm">
                  ₹{plan.priceOriginal.toLocaleString('en-IN')}
                </span>
                <span className="text-xl font-bold text-red-600">
                  ₹{plan.priceFinal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Add-ons */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Add-ons
              </p>

              {/* Astro Consultation */}
              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                plan.addons.astroConsultation.enabled
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-gray-50'
              }`}>
                <div>
                  <p className="text-xs font-medium text-gray-700">Astro Consultation</p>
                  {plan.addons.astroConsultation.enabled && (
                    <p className="text-xs text-gray-500">
                      <span className="line-through">
                        ₹{plan.addons.astroConsultation.priceOriginal?.toLocaleString('en-IN')}
                      </span>
                      {' → '}+₹{plan.addons.astroConsultation.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  plan.addons.astroConsultation.enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {plan.addons.astroConsultation.enabled ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Express Delivery */}
              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                plan.addons.expressDelivery.enabled
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-gray-50'
              }`}>
                <div>
                  <p className="text-xs font-medium text-gray-700">Express Delivery</p>
                  {plan.addons.expressDelivery.enabled && (
                    <p className="text-xs text-gray-500">
                      +₹{plan.addons.expressDelivery.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  plan.addons.expressDelivery.enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {plan.addons.expressDelivery.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => router.push(`/manage-report-pricing/edit/${plan.planId}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleToggle(plan.planId, plan.isActive)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-all ${
                  plan.isActive
                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                    : 'text-green-600 bg-green-50 hover:bg-green-100'
                }`}
              >
                {plan.isActive
                  ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
                  : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
                }
              </button>
              {/* <button
                onClick={() => handleDelete(plan.planId, plan.title)}
                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No plans found</p>
          <p className="text-sm mt-1">Click "Add Plan" to create your first plan</p>
        </div>
      )}
    </div>
  );
};

export default LJRPlansList;