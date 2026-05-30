'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, GripVertical } from 'lucide-react';
import Swal from 'sweetalert2';

interface Plan {
  _id: string;
  planId: string;
  title: string;
  priceFinal: number;
  isActive: boolean;
}

interface FormState {
  groupId: string;
  title: string;
  description: string;
  sortOrder: number | '';
  isActive: boolean;
  plans: string[]; // planId strings
}

const defaultForm: FormState = {
  groupId: '',
  title: '',
  description: '',
  sortOrder: '',
  isActive: true,
  plans: [],
};

const LJRPlanGroupForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const [form, setForm] = useState<FormState>(defaultForm);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) setAllPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!isEdit || !groupId) return;
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plan-groups/${groupId}`, {
          credentials: 'include'
        }
        );
        const data = await res.json();
        if (data.success) {
          const g = data.group;
          setForm({
            groupId: g.groupId,
            title: g.title,
            description: g.description || '',
            sortOrder: g.sortOrder,
            isActive: g.isActive,
            plans: g.plans.map((p: any) => p.planId ?? p),
          });
        }
      } catch (err) {
        console.error('Error fetching group:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [isEdit, groupId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.groupId.trim()) newErrors.groupId = 'Group ID is required';
    if (!form.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePlan = (planId: string) => {
    setForm(prev => ({
      ...prev,
      plans: prev.plans.includes(planId)
        ? prev.plans.filter(id => id !== planId)
        : [...prev.plans, planId],
    }));
  };

  const removePlan = (planId: string) => {
    setForm(prev => ({ ...prev, plans: prev.plans.filter(id => id !== planId) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plan-groups/${groupId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plan-groups`;

      const method = isEdit ? 'PUT' : 'POST';

      const body = {
        groupId: form.groupId,
        title: form.title,
        description: form.description || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        plans: form.plans,
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
          isEdit ? 'Group updated successfully.' : 'Group created successfully.',
          'success'
        );
        router.push('/manage-report-pricing');
      } else {
        Swal.fire('Error', data.message || 'Something went wrong.', 'error');
      }
    } catch (err) {
      console.error('Error saving group:', err);
      Swal.fire('Error', 'Failed to save group.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlans = allPlans.filter(p => form.plans.includes(p.planId));
  const availablePlans = allPlans.filter(p => !form.plans.includes(p.planId));

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
            {isEdit ? 'Edit Group' : 'New Plan Group'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Update group settings and plan assignments' : 'Group multiple plans under one label'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Group Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Group ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.groupId}
                disabled={isEdit}
                onChange={(e) => setForm(prev => ({ ...prev, groupId: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${isEdit
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : errors.groupId
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                placeholder="e.g. life-journey-bundle"
              />
              {isEdit && <p className="text-xs text-gray-400 mt-1">Group ID cannot be changed</p>}
              {errors.groupId && <p className="text-red-500 text-xs mt-1">{errors.groupId}</p>}
            </div>

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
                placeholder="e.g. Life Journey Reports"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                placeholder="Short description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    sortOrder: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Plan Picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">Assign Plans</h2>
          <p className="text-xs text-gray-500 mb-4">
            Select which plans belong to this group. Order follows each plan's own sortOrder.
          </p>

          {/* Selected plans */}
          {selectedPlans.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                In this group ({selectedPlans.length})
              </p>
              <div className="space-y-2">
                {selectedPlans.map(plan => (
                  <div
                    key={plan.planId}
                    className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                      <div>
                        <span className="text-xs font-mono text-gray-500 mr-2">{plan.planId}</span>
                        <span className="text-sm font-medium text-gray-800">{plan.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        ₹{plan.priceFinal.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePlan(plan.planId)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available plans */}
          {availablePlans.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Available to add
              </p>
              <div className="space-y-2">
                {availablePlans.map(plan => (
                  <button
                    key={plan.planId}
                    type="button"
                    onClick={() => togglePlan(plan.planId)}
                    className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 transition-all text-left"
                  >
                    <div>
                      <span className="text-xs font-mono text-gray-400 mr-2">{plan.planId}</span>
                      <span className="text-sm text-gray-700">{plan.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        ₹{plan.priceFinal.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${plan.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                        }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-red-500 font-medium">+ Add</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {allPlans.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              No plans found. Create some plans first.
            </p>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">Group Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.isActive ? 'Group is visible in the admin panel' : 'Group is hidden'}
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
              : <><Save className="w-4 h-4" /> {isEdit ? 'Update Group' : 'Create Group'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default LJRPlanGroupForm;