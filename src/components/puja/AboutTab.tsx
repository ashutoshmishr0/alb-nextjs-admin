'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface AboutItem {
  _id: string;
  title: string;
  content: string;
  image: string;
}

interface AboutTabProps {
  about: AboutItem[];
  setAbout: React.Dispatch<React.SetStateAction<AboutItem[]>>;
  addItem: (array: any[], setArray: any, template: any) => void;
  updateItem: (array: any[], setArray: any, identifier: string | number, field: string, value: any) => void;
  removeItem: (array: any[], setArray: any, identifier: string | number) => void;
  fieldErrors?: Record<string, string>;
}

const AboutTab: React.FC<AboutTabProps> = ({
  about,
  setAbout,
  addItem,
  updateItem,
  removeItem,
  fieldErrors
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">About Section</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add detailed information about the puja, its history, and significance
          </p>
        </div>
        <button
          type="button"
          onClick={() => addItem(about, setAbout, { 
            title: '', 
            content: '', 
            image: '' 
          })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {fieldErrors?.['about'] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {fieldErrors['about']}
        </div>
      )}

      <div className="space-y-4">
        {about.map((section, index) => (
          <div key={section._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateItem(about, setAbout, section._id, 'title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                    fieldErrors?.[`about.${index}.title`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., The Significance of Mahamrityunjay Puja"
                />
                {fieldErrors?.[`about.${index}.title`] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[`about.${index}.title`]}</p>
                )}
              </div>

              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={section.content}
                  onChange={(e) => updateItem(about, setAbout, section._id, 'content', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                    fieldErrors?.[`about.${index}.content`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Write detailed information about the puja..."
                />
                {fieldErrors?.[`about.${index}.content`] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[`about.${index}.content`]}</p>
                )}
              </div>

              <div className="md:col-span-1 flex items-end justify-end">
                {about.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(about, setAbout, section._id)}
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
        <p>💡 <strong>Tip:</strong> The About section should provide comprehensive information about the puja's history, significance, and benefits.</p>
      </div>
    </div>
  );
};

export default AboutTab;