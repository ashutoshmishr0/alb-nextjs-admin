'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, GripVertical, Plus, Search, Star } from 'lucide-react';
import Swal from 'sweetalert2';

interface Plan {
  _id: string;
  planId: string;
  title: string;
  priceFinal: number;
  isActive: boolean;
}

interface Testimonial {
  name: string;
  description: string;
  stars: number;
  position?: string;
}

interface FAQ {
  question: string;
  answer: string;
  sortOrder?: number;
}

interface FormState {
  groupId: string;
  title: string;
  slug: string;
  sortOrder: number | '';
  isActive: boolean;
  plans: string[];
  testimonials: Testimonial[];
  faqs: FAQ[];
}

const defaultForm: FormState = {
  groupId: '',
  title: '',
  slug: '',
  sortOrder: '',
  isActive: true,
  plans: [],
  testimonials: [],
  faqs: [],
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

  // Search states
  const [selectedSearch, setSelectedSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/admin/plans`, {
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
          `/api/admin/plan-groups/${groupId}`, {
          credentials: 'include'
        }
        );
        const data = await res.json();
        if (data.success) {
          const g = data.group;
          setForm({
            groupId: g.groupId,
            title: g.title,
            slug: g.slug || '',
            sortOrder: g.sortOrder,
            isActive: g.isActive,
            plans: g.plans.map((p: any) => p.planId ?? p),
            testimonials: g.testimonials || [],
            faqs: g.faqs || [],
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

  const selectedPlans = allPlans.filter(p => form.plans.includes(p.planId));
  const availablePlans = allPlans.filter(p => !form.plans.includes(p.planId));

  const filteredSelectedPlans = selectedPlans.filter(p =>
    p.planId.toLowerCase().includes(selectedSearch.toLowerCase()) ||
    p.title.toLowerCase().includes(selectedSearch.toLowerCase())
  );

  const filteredAvailablePlans = availablePlans.filter(p =>
    p.planId.toLowerCase().includes(availableSearch.toLowerCase()) ||
    p.title.toLowerCase().includes(availableSearch.toLowerCase())
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.groupId.trim()) newErrors.groupId = 'Group ID is required';
    if (!form.title.trim()) newErrors.title = 'Title is required';

    form.testimonials.forEach((t, i) => {
      if (!t.name.trim()) newErrors[`testimonial_${i}_name`] = 'Name is required';
      if (!t.description.trim()) newErrors[`testimonial_${i}_desc`] = 'Description is required';
      if (!t.stars || t.stars < 1 || t.stars > 5) newErrors[`testimonial_${i}_stars`] = 'Stars must be 1-5';
    });

    form.faqs.forEach((f, i) => {
      if (!f.question.trim()) newErrors[`faq_${i}_question`] = 'Question is required';
      if (!f.answer.trim()) newErrors[`faq_${i}_answer`] = 'Answer is required';
    });

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
    setSelectedSearch('');
    setAvailableSearch('');
  };

  const removePlan = (planId: string) => {
    setForm(prev => ({ ...prev, plans: prev.plans.filter(id => id !== planId) }));
    setSelectedSearch('');
    setAvailableSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/plan-groups/${groupId}`
        : `/api/admin/plan-groups`;

      const method = isEdit ? 'PUT' : 'POST';

      const body = {
        groupId: form.groupId,
        title: form.title,
        slug: form.slug || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        plans: form.plans,
        testimonials: form.testimonials,
        faqs: form.faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder || 0
        })),
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

  const renderStars = (value: number, onChange: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
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

            {/* Group ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Group ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.groupId}
                disabled={isEdit}
                onChange={(e) => setForm(prev => ({ ...prev, groupId: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${
                  isEdit
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Life Journey Reports"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Slug
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                placeholder="e.g. life-journey-bundle"
              />
            </div>
            {/* Sort Order + Slug — same row */}
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

        {/* Testimonials Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">Testimonials</h2>
              <p className="text-xs text-gray-500">Customer reviews with name, rating, and feedback</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                testimonials: [...prev.testimonials, { name: '', description: '', stars: 5, position: '' }]
              }))}
              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Testimonial
            </button>
          </div>

          {form.testimonials.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No testimonials added yet.
            </p>
          )}

          <div className="space-y-4">
            {form.testimonials.map((testimonial, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-gray-500">Testimonial #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      testimonials: prev.testimonials.filter((_, idx) => idx !== i)
                    }))}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={testimonial.name}
                      onChange={(e) => {
                        const updated = [...form.testimonials];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setForm(prev => ({ ...prev, testimonials: updated }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none ${
                        errors[`testimonial_${i}_name`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Customer name"
                    />
                    {errors[`testimonial_${i}_name`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`testimonial_${i}_name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    {renderStars(testimonial.stars, (val) => {
                      const updated = [...form.testimonials];
                      updated[i] = { ...updated[i], stars: val };
                      setForm(prev => ({ ...prev, testimonials: updated }));
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Testimonial Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={testimonial.description}
                      onChange={(e) => {
                        const updated = [...form.testimonials];
                        updated[i] = { ...updated[i], description: e.target.value };
                        setForm(prev => ({ ...prev, testimonials: updated }));
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none ${
                        errors[`testimonial_${i}_desc`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What did the customer say?"
                    />
                    {errors[`testimonial_${i}_desc`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`testimonial_${i}_desc`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position/Title (optional)
                    </label>
                    <input
                      type="text"
                      value={testimonial.position || ''}
                      onChange={(e) => {
                        const updated = [...form.testimonials];
                        updated[i] = { ...updated[i], position: e.target.value };
                        setForm(prev => ({ ...prev, testimonials: updated }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="e.g., CEO, Founder, Customer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">FAQs</h2>
              <p className="text-xs text-gray-500">Frequently asked questions for this group</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                faqs: [...prev.faqs, { question: '', answer: '', sortOrder: prev.faqs.length }]
              }))}
              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add FAQ
            </button>
          </div>

          {form.faqs.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No FAQs added yet.
            </p>
          )}

          <div className="space-y-4">
            {form.faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">FAQ #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      faqs: prev.faqs.filter((_, idx) => idx !== i)
                    }))}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Question <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...form.faqs];
                        updated[i] = { ...updated[i], question: e.target.value };
                        setForm(prev => ({ ...prev, faqs: updated }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none ${
                        errors[`faq_${i}_question`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., How long does delivery take?"
                    />
                    {errors[`faq_${i}_question`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`faq_${i}_question`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Answer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...form.faqs];
                        updated[i] = { ...updated[i], answer: e.target.value };
                        setForm(prev => ({ ...prev, faqs: updated }));
                      }}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none ${
                        errors[`faq_${i}_answer`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Delivery typically takes 3-5 business days..."
                    />
                    {errors[`faq_${i}_answer`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`faq_${i}_answer`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">Assign Plans</h2>
          <p className="text-xs text-gray-500 mb-4">
            Select which plans belong to this group. Order follows each plan's own sortOrder.
          </p>

          {selectedPlans.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                In this group ({selectedPlans.length})
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in selected plans..."
                  value={selectedSearch}
                  onChange={(e) => setSelectedSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredSelectedPlans.map(plan => (
                  <div key={plan.planId} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                      <div>
                        <span className="text-xs font-mono text-gray-500 mr-2">{plan.planId}</span>
                        <span className="text-sm font-medium text-gray-800">{plan.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">₹{plan.priceFinal.toLocaleString('en-IN')}</span>
                      <button type="button" onClick={() => removePlan(plan.planId)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredSelectedPlans.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No matching plans found</p>}
              </div>
            </div>
          )}

          {availablePlans.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Available to add ({availablePlans.length})
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Plan ID or Title..."
                  value={availableSearch}
                  onChange={(e) => setAvailableSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredAvailablePlans.map(plan => (
                  <button key={plan.planId} type="button" onClick={() => togglePlan(plan.planId)} className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 transition-all text-left">
                    <div>
                      <span className="text-xs font-mono text-gray-400 mr-2">{plan.planId}</span>
                      <span className="text-sm text-gray-700">{plan.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">₹{plan.priceFinal.toLocaleString('en-IN')}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${plan.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-red-500 font-medium">+ Add</span>
                    </div>
                  </button>
                ))}
                {filteredAvailablePlans.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No matching plans found</p>}
              </div>
            </div>
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-6">
          <button type="button" onClick={() => router.push('/manage-report-pricing')} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-60">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</> : <><Save className="w-4 h-4" /> {isEdit ? 'Update Group' : 'Create Group'}</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default LJRPlanGroupForm;