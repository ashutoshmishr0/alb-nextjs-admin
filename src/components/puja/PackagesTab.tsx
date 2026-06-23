'use client';

import React, { useState } from 'react';
import { BanknoteIcon, Plus, Trash2, Crown, Check } from 'lucide-react';

interface Props {
  pricingPackages: any[];
  setPricingPackages: (data: any[]) => void;
  addItem: any;
  updateItem: any;
  updatePackageFeature: any;
  addPackageFeature: any;
  removePackageFeature: any;
  handlePopularPackageChange: any;
  removeItem: any;
  fieldErrors?: Record<string, string>;
}

const PackagesTab: React.FC<Props> = ({
  pricingPackages,
  setPricingPackages,
  addItem,
  updateItem,
  updatePackageFeature,
  addPackageFeature,
  removePackageFeature,
  handlePopularPackageChange,
  removeItem,
  fieldErrors = {}
}) => {
  const [showTemplate, setShowTemplate] = useState(false);

  const packageTemplates = [
    {
      title: 'Basic Package',
      price: 999,
      features: ['Standard puja materials', 'Duration: 1-2 hours', 'Basic offerings'],
      recommended: false
    },
    {
      title: 'Premium Package',
      price: 1999,
      features: ['Premium materials', 'Extended duration', 'Special offerings', 'Video recording'],
      recommended: true
    },
    {
      title: 'VIP Package',
      price: 2999,
      features: ['All premium materials', 'Personalized rituals', 'Live streaming', 'Post-puja guidance', 'Gift hamper'],
      recommended: true
    },
    {
      title: 'Family Package',
      price: 3999,
      features: ['For entire family', 'Multiple rituals', 'Extended duration', 'Video recording', 'Family blessings'],
      recommended: false
    }
  ];

  const applyTemplate = (template: any) => {
    const newId = pricingPackages.length > 0 ? Math.max(...pricingPackages.map(item => item.id)) + 1 : 1;
    const newPackage = {
      id: newId,
      title: template.title,
      price: template.price,
      isPopular: template.recommended,
      features: template.features
    };
    setPricingPackages([...pricingPackages, newPackage]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pricing Packages</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create different packages with varying features and prices
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* <button
            type="button"
            onClick={() => setShowTemplate(!showTemplate)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {showTemplate ? 'Hide Templates' : 'Show Templates'}
          </button> */}
          <button
            type="button"
            onClick={() => addItem(pricingPackages, setPricingPackages, { 
              title: '', 
              price: 0, 
              isPopular: false, 
              features: [''] 
            })}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      </div>

      {/* General error for pricingPackages array */}
      {fieldErrors['pricingPackages'] && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-red-600 text-sm">{fieldErrors['pricingPackages']}</p>
        </div>
      )}

      {/* Templates */}
      {showTemplate && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packageTemplates.map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => applyTemplate(template)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{template.title}</h4>
                    <div className="text-2xl font-bold text-red-600 mt-2">₹{template.price}</div>
                  </div>
                  {template.recommended && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <ul className="space-y-1 mb-4">
                  {template.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-center">
                  <div className="text-sm text-red-600 font-medium">Click to apply</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="space-y-8">
        {pricingPackages.map((pkg, pkgIndex) => {
          const titleError = fieldErrors[`pricingPackages.${pkgIndex}.title`];
          const priceError = fieldErrors[`pricingPackages.${pkgIndex}.price`];
          const featuresError = fieldErrors[`pricingPackages.${pkgIndex}.features`];

          return (
            <div key={pkg.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                    <BanknoteIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Package #{pkg.id}</h3>
                    <p className="text-xs text-gray-500">Configure package details</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pkg.isPopular && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(pricingPackages, setPricingPackages, pkg.id)}
                    disabled={pricingPackages.length <= 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Package Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pkg.title}
                    onChange={(e) => updateItem(pricingPackages, setPricingPackages, pkg.id, 'title', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all ${
                      titleError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                    }`}
                    placeholder="e.g., Basic, Premium, VIP"
                    required
                  />
                  {titleError && (
                    <p className="text-red-500 text-xs mt-1.5">{titleError}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={pkg.price}
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    onChange={(e) => updateItem(pricingPackages, setPricingPackages, pkg.id, 'price', parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all ${
                      priceError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                    }`}
                    placeholder="0"
                    required
                    min="0"
                  />
                  {priceError && (
                    <p className="text-red-500 text-xs mt-1.5">{priceError}</p>
                  )}
                </div>

                {/* Original Price */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={pkg.originalPrice || ''}
                    onChange={(e) => updateItem(pricingPackages, setPricingPackages, pkg.id, 'originalPrice', parseFloat(e.target.value) || '')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="For showing discount"
                    min="0"
                  />
                </div> */}

                {/* Discount */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Display
                  </label>
                  <input
                    type="text"
                    value={pkg.discount || ''}
                    onChange={(e) => updateItem(pricingPackages, setPricingPackages, pkg.id, 'discount', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="e.g., 20% OFF"
                  />
                </div> */}
              </div>

              {/* Features Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Package Features <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addPackageFeature(pkg.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                </div>
                
                {featuresError && (
                  <p className="text-red-500 text-xs mb-3">{featuresError}</p>
                )}
                
                <div className="space-y-3">
                  {pkg.features.map((feature: string, featureIndex: number) => {
                    const featureError = fieldErrors[`pricingPackages.${pkgIndex}.features.${featureIndex}`];
                    
                    return (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updatePackageFeature(pkg.id, featureIndex, e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all ${
                              featureError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                            }`}
                            placeholder="Enter feature (e.g., Video recording included)"
                            required
                          />
                          {featureError && (
                            <p className="text-red-500 text-xs mt-1.5">{featureError}</p>
                          )}
                        </div>
                        {pkg.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePackageFeature(pkg.id, featureIndex)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PackagesTab;