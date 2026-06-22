'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface WhyPerformReason {
  _id: string;
  title: string;
  description: string;
  icon: string;
}

interface WhyPerformReasonsTabProps {
  whyPerformReasons: WhyPerformReason[];
  setWhyPerformReasons: React.Dispatch<React.SetStateAction<WhyPerformReason[]>>;
  addItem: (array: any[], setArray: any, template: any) => void;
  updateItem: (array: any[], setArray: any, identifier: string | number, field: string, value: any) => void;
  removeItem: (array: any[], setArray: any, identifier: string | number) => void;
  fieldErrors?: Record<string, string>;
}

const WhyPerformReasonsTab: React.FC<WhyPerformReasonsTabProps> = ({
  whyPerformReasons,
  setWhyPerformReasons,
  addItem,
  updateItem,
  removeItem,
  fieldErrors
}) => {
  const iconOptions = [
    'Shield', 'Star', 'Heart', 'Target', 'Award', 
    'Flame', 'Droplet', 'Sun', 'Moon', 'Leaf', 
    'Gem', 'Crown', 'Lightning', 'Compass'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Why Perform Reasons</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add reasons why someone should perform this puja
          </p>
        </div>
        <button
          type="button"
          onClick={() => addItem(whyPerformReasons, setWhyPerformReasons, { 
            title: '', 
            description: '', 
            icon: 'Shield' 
          })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Reason
        </button>
      </div>

      {fieldErrors?.['whyPerformReasons'] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {fieldErrors['whyPerformReasons']}
        </div>
      )}

      <div className="space-y-4">
        {whyPerformReasons.map((reason, index) => (
          <div key={reason._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason.title}
                  onChange={(e) => updateItem(whyPerformReasons, setWhyPerformReasons, reason._id, 'title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                    fieldErrors?.[`whyPerformReasons.${index}.title`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Remove Negative Energies"
                />
                {fieldErrors?.[`whyPerformReasons.${index}.title`] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[`whyPerformReasons.${index}.title`]}</p>
                )}
              </div>

              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason.description}
                  onChange={(e) => updateItem(whyPerformReasons, setWhyPerformReasons, reason._id, 'description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                    fieldErrors?.[`whyPerformReasons.${index}.description`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Clears negative aura and brings positivity"
                />
                {fieldErrors?.[`whyPerformReasons.${index}.description`] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[`whyPerformReasons.${index}.description`]}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <select
                  value={reason.icon}
                  onChange={(e) => updateItem(whyPerformReasons, setWhyPerformReasons, reason._id, 'icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1 flex items-end justify-end">
                {whyPerformReasons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(whyPerformReasons, setWhyPerformReasons, reason._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p>💡 <strong>Tip:</strong> Each reason should clearly explain the benefit of performing this puja. Use descriptive titles and detailed descriptions.</p>
      </div>
    </div>
  );
};

export default WhyPerformReasonsTab;