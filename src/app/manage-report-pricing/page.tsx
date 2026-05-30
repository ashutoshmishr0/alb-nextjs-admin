'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Layers, ChevronDown, ChevronRight, FolderPlus, Trash2, Pencil } from 'lucide-react';
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

interface PlanGroup {
  _id: string;
  groupId: string;
  title: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  plans: Plan[];
}

const PlanCard = ({
  plan,
  onToggle,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onToggle: (planId: string, current: boolean) => void;
  onEdit: (planId: string) => void;
  onDelete: (planId: string, title: string) => void;
}) => (
  <div
    className={`bg-white rounded-xl border-2 shadow-sm p-5 flex flex-col gap-4 transition-all ${plan.isActive ? 'border-gray-200' : 'border-red-200 opacity-70'
      }`}
  >
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
        className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
      >
        {plan.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>

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

    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add-ons</p>

      <div className={`flex items-center justify-between p-2.5 rounded-lg border ${plan.addons.astroConsultation.enabled
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
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.addons.astroConsultation.enabled
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-200 text-gray-500'
          }`}>
          {plan.addons.astroConsultation.enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className={`flex items-center justify-between p-2.5 rounded-lg border ${plan.addons.expressDelivery.enabled
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
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.addons.expressDelivery.enabled
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-200 text-gray-500'
          }`}>
          {plan.addons.expressDelivery.enabled ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
      <button
        onClick={() => onEdit(plan.planId)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
      >
        <Edit2 className="w-3.5 h-3.5" />
        Edit
      </button>
      <button
        onClick={() => onToggle(plan.planId, plan.isActive)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-all ${plan.isActive
          ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
          : 'text-green-600 bg-green-50 hover:bg-green-100'
          }`}
      >
        {plan.isActive
          ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
          : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
        }
      </button>
      <button
        onClick={() => onDelete(plan.planId, plan.title)}
        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

const GroupSection = ({
  group,
  onTogglePlan,
  onEditPlan,
  onEditGroup,
  onDeleteGroup,
  onDeletePlan,
}: {
  group: PlanGroup;
  onTogglePlan: (planId: string, current: boolean) => void;
  onEditPlan: (planId: string) => void;
  onEditGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string, title: string) => void;
  onDeletePlan: (planId: string, title: string) => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 group"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          }
          <Layers className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-800 text-base">{group.title}</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-1">
            {group.groupId}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {group.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {group.plans.length} plan{group.plans.length !== 1 ? 's' : ''}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditGroup(group.groupId)}
            className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit group"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteGroup(group.groupId, group.title)}
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pl-6 border-l-2 border-red-100">
          {group.plans.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full py-4">
              No plans in this group yet.
            </p>
          ) : (
            group.plans
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(plan => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onToggle={onTogglePlan}
                  onEdit={onEditPlan}
                  onDelete={onDeletePlan}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
};

const LJRPlansList = () => {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [groups, setGroups] = useState<PlanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grouped' | 'all'>('grouped');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, groupsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plan-groups`, { credentials: 'include' }),
      ]);
      const plansData = await plansRes.json();
      const groupsData = await groupsRes.json();
      if (plansData.success) setPlans(plansData.plans);
      if (groupsData.success) setGroups(groupsData.groups);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
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
        {
          method: 'PATCH',
          credentials: 'include'
        }
      );
      const data = await res.json();
      if (data.success) {
        setPlans(prev =>
          prev.map(p => p.planId === planId ? { ...p, isActive: data.isActive } : p)
        );
        setGroups(prev =>
          prev.map(g => ({
            ...g,
            plans: g.plans.map(p =>
              p.planId === planId ? { ...p, isActive: data.isActive } : p
            ),
          }))
        );
        Swal.fire('Done!', data.message, 'success');
      }
    } catch (err) {
      console.error('Error toggling plan:', err);
    }
  };

  const handleDeleteGroup = async (groupId: string, title: string) => {
    const result = await Swal.fire({
      title: 'Delete Group?',
      text: `"${title}" group will be deleted. The plans inside will NOT be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Delete Group',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/plan-groups/${groupId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setGroups(prev => prev.filter(g => g.groupId !== groupId));
        Swal.fire('Deleted!', 'Group deleted. Plans are still intact.', 'success');
      }
    } catch (err) {
      console.error('Error deleting group:', err);
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
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await res.json();

      if (data.success) {
        setPlans(prev =>
          prev.map(p =>
            p.planId === planId
              ? { ...p, isActive: false }
              : p
          )
        );

        setGroups(prev =>
          prev.map(g => ({
            ...g,
            plans: g.plans.map(p =>
              p.planId === planId
                ? { ...p, isActive: false }
                : p
            ),
          }))
        );

        Swal.fire(
          'Deactivated!',
          `"${title}" has been deactivated.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Error deactivating plan:', err);

      Swal.fire(
        'Error',
        'Something went wrong while deactivating the plan.',
        'error'
      );
    }
  };
  // Plans that are not in any group
  const groupedPlanIds = new Set(groups.flatMap(g => g.plans.map(p => p.planId)));
  const ungroupedPlans = plans
    .filter(p => !groupedPlanIds.has(p.planId))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    fetchData();
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/manage-report-pricing/add-group')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            New Group
          </button>
          <button
            onClick={() => router.push('/manage-report-pricing/add')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('grouped')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'grouped'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Grouped
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'all'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          All Plans ({plans.length})
        </button>
      </div>

      {view === 'grouped' ? (
        <>
          {/* Groups */}
          {groups
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(group => (
              <GroupSection
                key={group.groupId}
                group={group}
                onTogglePlan={handleTogglePlan}
                onEditPlan={(planId) => router.push(`/manage-report-pricing/edit/${planId}`)}
                onEditGroup={(groupId) => router.push(`/manage-report-pricing/edit-group/${groupId}`)}
                onDeleteGroup={handleDeleteGroup}
                onDeletePlan={handleDelete}
              />
            ))}

          {/* Ungrouped plans */}
          {ungroupedPlans.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Ungrouped
                </span>
                <span className="text-xs text-gray-400">
                  {ungroupedPlans.length} plan{ungroupedPlans.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ungroupedPlans.map(plan => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    onToggle={handleTogglePlan}
                    onEdit={(planId) => router.push(`/manage-report-pricing/edit/${planId}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {groups.length === 0 && ungroupedPlans.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No plans found</p>
              <p className="text-sm mt-1">Click "Add Plan" to create your first plan</p>
            </div>
          )}
        </>
      ) : (
        /* All plans flat view, sorted by sortOrder */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(plan => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onToggle={handleTogglePlan}
                onEdit={(planId) => router.push(`/manage-report-pricing/edit/${planId}`)}
                onDelete={handleDelete}
              />
            ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No plans found</p>
              <p className="text-sm mt-1">Click "Add Plan" to create your first plan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LJRPlansList;