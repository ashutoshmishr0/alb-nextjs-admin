'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface AashirwadBoxTabProps {
  aashirwadBox: string[];
  setAashirwadBox: React.Dispatch<React.SetStateAction<string[]>>;
  fieldErrors?: Record<string, string>;
}

const AashirwadBoxTab: React.FC<AashirwadBoxTabProps> = ({
  aashirwadBox,
  setAashirwadBox,
  fieldErrors
}) => {
  const addItem = () => {
    setAashirwadBox([...aashirwadBox, '']);
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...aashirwadBox];
    updated[index] = value;
    setAashirwadBox(updated);
  };

  const removeItem = (index: number) => {
    if (aashirwadBox.length > 1) {
      setAashirwadBox(aashirwadBox.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Aashirwad Box Items</h2>
          <p className="text-sm text-gray-500 mt-1">
            List items that will be sent in the Aashirwad (Prasad) Box
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {fieldErrors?.['aashirwadBox'] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {fieldErrors['aashirwadBox']}
        </div>
      )}

      <div className="space-y-3">
        {aashirwadBox.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                  fieldErrors?.[`aashirwadBox.${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={`Item ${index + 1}: e.g., Sacred Vibhuti (Holy Ash) from Kashi Vishwanath`}
              />
              {fieldErrors?.[`aashirwadBox.${index}`] && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors[`aashirwadBox.${index}`]}</p>
              )}
            </div>
            {aashirwadBox.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p>💡 <strong>Tip:</strong> Items like Vibhuti, Rudraksha, Yantra, and blessed Prasad are commonly included in Aashirwad Box.</p>
      </div>
    </div>
  );
};

export default AashirwadBoxTab;