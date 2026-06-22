'use client';

import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface RitualStep {
  _id: string;
  title: string;
  description: string;
  icon: string;
  stepNumber: number;
}

interface RitualProcessTabProps {
  ritualProcess: RitualStep[];
  setRitualProcess: React.Dispatch<React.SetStateAction<RitualStep[]>>;
  addItem: (array: any[], setArray: any, template: any) => void;
  updateItem: (array: any[], setArray: any, identifier: string | number, field: string, value: any) => void;
  removeItem: (array: any[], setArray: any, identifier: string | number) => void;
  fieldErrors?: Record<string, string>;
}

const RitualProcessTab: React.FC<RitualProcessTabProps> = ({
  ritualProcess,
  setRitualProcess,
  addItem,
  updateItem,
  removeItem,
  fieldErrors
}) => {
  const iconOptions = [
    'BookOpen', 'Camera', 'Gift', 'Hand', 'Heart',
    'Home', 'Mail', 'MapPin', 'Music', 'Phone',
    'Star', 'Sun', 'Moon', 'Cloud', 'Flame'
  ];

  const updateStepNumber = (index: number, newNumber: number) => {
    const updated = [...ritualProcess];
    updated[index].stepNumber = newNumber;
    // Re-sort by step number
    updated.sort((a, b) => a.stepNumber - b.stepNumber);
    setRitualProcess(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Ritual Process</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define the step-by-step process of how the ritual is conducted
          </p>
        </div>
        <button
          type="button"
          onClick={() => addItem(ritualProcess, setRitualProcess, { 
            title: '', 
            description: '', 
            icon: '',
            stepNumber: ritualProcess.length + 1
          })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {fieldErrors?.['ritualProcess'] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {fieldErrors['ritualProcess']}
        </div>
      )}

      <div className="space-y-4">
        {ritualProcess.map((step, index) => (
          <div key={step._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 mt-1">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <span className="text-sm font-medium text-gray-500">Step</span>
                <input
                  type="number"
                  value={step.stepNumber}
                  onChange={(e) => updateStepNumber(index, parseInt(e.target.value) || 1)}
                  className="w-12 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  min="1"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateItem(ritualProcess, setRitualProcess, step._id, 'title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                      fieldErrors?.[`ritualProcess.${index}.title`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Live Access"
                  />
                  {fieldErrors?.[`ritualProcess.${index}.title`] && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors[`ritualProcess.${index}.title`]}</p>
                  )}
                </div>

                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step.description}
                    onChange={(e) => updateItem(ritualProcess, setRitualProcess, step._id, 'description', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                      fieldErrors?.[`ritualProcess.${index}.description`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Watch the ritual live from the temple via a private HD link"
                  />
                  {fieldErrors?.[`ritualProcess.${index}.description`] && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors[`ritualProcess.${index}.description`]}</p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={step.icon}
                    onChange={(e) => updateItem(ritualProcess, setRitualProcess, step._id, 'icon', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    <option value="">None</option>
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1 flex items-end justify-end">
                  {ritualProcess.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(ritualProcess, setRitualProcess, step._id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p>💡 <strong>Tip:</strong> Each step should clearly explain what happens during the ritual. Examples: Live Access, Personal Sankalp, Aashirwad Box delivery.</p>
      </div>
    </div>
  );
};

export default RitualProcessTab;