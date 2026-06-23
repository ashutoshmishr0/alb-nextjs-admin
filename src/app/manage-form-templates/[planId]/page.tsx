'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronDown,
  ChevronRight, Eye, EyeOff, Copy, AlertCircle, CheckCircle2,
  Settings, Layers, Zap, Search, X, Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';

// ─── KNOWN_FIELDS inline (import from your KNOWN_FIELDS.ts in real project) ──

type FieldType =
  | 'text' | 'email' | 'tel' | 'date' | 'time'
  | 'select' | 'checkbox' | 'textarea' | 'location'
  | 'pincode' | 'gender' | 'language';

interface KnownField {
  key: string;
  mapTo: string;
  label: string;
  placeholder: string;
  type: FieldType;
  required: boolean;
  hidden?: boolean;
  gridCols: 1 | 2;
  category: 'personal' | 'birth' | 'partner' | 'consultation' | 'system' | 'report';
  description: string;
  fills?: { latKey: string; lngKey: string };
  validation?: { type: string; value?: number | string; message: string }[];
  defaultValue?: string;
}

const KNOWN_FIELDS: KnownField[] = [
  {
    key: 'name', mapTo: 'name', label: 'Name', placeholder: 'Enter your full name',
    type: 'text', required: true, gridCols: 1, category: 'personal',
    description: 'Full name of the person ordering the report',
    validation: [
      { type: 'minLength', value: 2, message: 'Name must be at least 2 characters.' },
      { type: 'regex', value: '^[a-zA-Z\\s]+$', message: 'Name can only contain letters and spaces.' },
    ],
  },
  {
    key: 'email', mapTo: 'email', label: 'Email', placeholder: 'Enter your email address',
    type: 'email', required: true, gridCols: 1, category: 'personal',
    description: 'Email for report delivery and order confirmation',
    validation: [{ type: 'email', message: 'Please enter a valid email address.' }],
  },
  {
    key: 'whatsapp', mapTo: 'whatsapp', label: 'WhatsApp Number', placeholder: 'Enter your WhatsApp number',
    type: 'tel', required: true, gridCols: 1, category: 'personal',
    description: 'WhatsApp number for report delivery and updates',
    validation: [{ type: 'minLength', value: 10, message: 'Please enter a valid WhatsApp number.' }],
  },
  {
    key: 'gender', mapTo: 'gender', label: 'Gender', placeholder: '',
    type: 'gender', required: true, gridCols: 1, category: 'personal',
    description: 'Gender — male / female dropdown',
    validation: [{ type: 'required', message: 'Please select a gender.' }],
  },
  {
    key: 'reportLanguage', mapTo: 'reportLanguage', label: 'Report Language', placeholder: '',
    type: 'language', required: true, gridCols: 1, category: 'personal',
    description: 'Language the report will be written in', defaultValue: 'english',
  },
  {
    key: 'dob', mapTo: 'dateOfBirth', label: 'Date of Birth', placeholder: '',
    type: 'date', required: true, gridCols: 1, category: 'birth',
    description: 'Date of birth — maps to dateOfBirth on backend',
    validation: [{ type: 'required', message: 'Please enter your date of birth.' }],
  },
  {
    key: 'tob', mapTo: 'timeOfBirth', label: 'Time of Birth', placeholder: '',
    type: 'time', required: false, gridCols: 1, category: 'birth',
    description: 'Time of birth — maps to timeOfBirth on backend',
  },
  {
    key: 'pob', mapTo: 'placeOfBirth', label: 'Place of Birth', placeholder: 'Search your birth city (e.g. Delhi, India)',
    type: 'location', required: true, gridCols: 2, category: 'birth',
    description: 'Google Places autocomplete — auto-fills birthLatitude & birthLongitude',
    fills: { latKey: 'birthLatitude', lngKey: 'birthLongitude' },
    validation: [{ type: 'minLength', value: 2, message: 'Place of birth is required.' }],
  },
  {
    key: 'pinCode', mapTo: 'placeOfBirthPincode', label: 'Birth Place Pin Code', placeholder: 'e.g. 110001',
    type: 'pincode', required: true, gridCols: 1, category: 'birth',
    description: 'Pin code of the birth city',
    validation: [{ type: 'minLength', value: 6, message: 'Please enter a valid pin code.' }],
  },
  {
    key: 'birthLatitude', mapTo: 'birthLatitude', label: '', placeholder: '',
    type: 'text', required: false, hidden: true, gridCols: 1, category: 'birth',
    description: 'Auto-filled by the Place of Birth location picker — hidden field',
    validation: [{ type: 'required', message: 'Please select a valid location from the dropdown.' }],
  },
  {
    key: 'birthLongitude', mapTo: 'birthLongitude', label: '', placeholder: '',
    type: 'text', required: false, hidden: true, gridCols: 1, category: 'birth',
    description: 'Auto-filled by the Place of Birth location picker — hidden field',
    validation: [{ type: 'required', message: 'Please select a valid location from the dropdown.' }],
  },
  {
    key: 'partnerDob', mapTo: 'partnerDateOfBirth', label: "Partner's Date of Birth", placeholder: '',
    type: 'date', required: true, gridCols: 1, category: 'partner',
    description: "Partner's DOB — maps to partnerDateOfBirth",
    validation: [{ type: 'required', message: "Partner's date of birth is required." }],
  },
  {
    key: 'partnerTob', mapTo: 'partnerTimeOfBirth', label: "Partner's Time of Birth", placeholder: '',
    type: 'time', required: false, gridCols: 1, category: 'partner',
    description: "Partner's time of birth",
  },
  {
    key: 'partnerPob', mapTo: 'partnerPlaceOfBirth', label: "Partner's Place of Birth", placeholder: 'City, State, Country',
    type: 'location', required: false, gridCols: 2, category: 'partner',
    description: "Partner's birth city — auto-fills partnerBirthLatitude & partnerBirthLongitude",
    fills: { latKey: 'partnerBirthLatitude', lngKey: 'partnerBirthLongitude' },
  },
  {
    key: 'partnerGender', mapTo: 'partnerGender', label: "Partner's Gender", placeholder: '',
    type: 'gender', required: false, gridCols: 1, category: 'partner',
    description: "Partner's gender",
  },
  {
    key: 'partnerBirthLatitude', mapTo: 'partnerBirthLatitude', label: '', placeholder: '',
    type: 'text', required: false, hidden: true, gridCols: 1, category: 'partner',
    description: 'Auto-filled by partner location picker — hidden field',
  },
  {
    key: 'partnerBirthLongitude', mapTo: 'partnerBirthLongitude', label: '', placeholder: '',
    type: 'text', required: false, hidden: true, gridCols: 1, category: 'partner',
    description: 'Auto-filled by partner location picker — hidden field',
  },
  {
    key: 'problemType', mapTo: 'problemType', label: 'Problem Type', placeholder: '',
    type: 'select', required: true, gridCols: 2, category: 'consultation',
    description: 'Type of problem for consultation — career, health, finance, couple, other',
    validation: [{ type: 'required', message: 'Please select a problem type.' }],
  },
  {
    key: 'questionOne', mapTo: 'questionOne', label: 'Question One', placeholder: 'Enter your first question for the astrologer',
    type: 'textarea', required: true, gridCols: 2, category: 'consultation',
    description: 'First question for ask-astrologer plans',
    validation: [{ type: 'required', message: 'Please enter your first question.' }],
  },
  {
    key: 'questionTwo', mapTo: 'questionTwo', label: 'Question Two', placeholder: 'Enter your second question for the astrologer',
    type: 'textarea', required: true, gridCols: 2, category: 'consultation',
    description: 'Second question for ask-astrologer plans',
    validation: [{ type: 'required', message: 'Please enter your second question.' }],
  },
  {
    key: 'source', mapTo: 'source', label: '', placeholder: '',
    type: 'text', required: false, hidden: true, gridCols: 1, defaultValue: 'simple',
    category: 'system', description: 'Traffic source tracking — hidden, defaults to "simple"',
  },
];

const CATEGORY_LABELS: Record<KnownField['category'], string> = {
  personal:     'Personal info',
  birth:        'Birth details',
  partner:      'Partner details',
  consultation: 'Consultation / questions',
  system:       'System / hidden',
  report:       'Report-specific',
};

const CATEGORY_COLORS: Record<KnownField['category'], { bg: string; text: string; dot: string }> = {
  personal:     { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  birth:        { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  partner:      { bg: 'bg-pink-50',   text: 'text-pink-700',   dot: 'bg-pink-400' },
  consultation: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  system:       { bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  report:       { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption { label: string; value: string; }

interface ShowIfCondition {
  dependsOn: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'truthy' | 'falsy';
  value: string | boolean | number | null;
  values?: string[];
}

interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'regex' | 'email' | 'phone';
  value?: number | string | null;
  message: string;
}

interface LocationMeta { latKey: string; lngKey: string; }

interface FieldDef {
  _tempId: string;
  key: string;
  label: string;
  placeholder: string;
  helperText: string;
  type: FieldType;
  options: SelectOption[];
  gridCols: 1 | 2;
  order: number;
  required: boolean;
  validation: ValidationRule[];
  showIf: ShowIfCondition[];
  mapTo: string;
  locationMeta: LocationMeta;
  hidden: boolean;
  defaultValue: string;
  fieldGroup: string;
}

interface Section {
  _tempId: string;
  sectionKey: string;
  heading: string;
  subheading: string;
  order: number;
  showIf: ShowIfCondition[];
  fields: FieldDef[];
  collapsed: boolean;
}

interface AddonField {
  _tempId: string;
  key: string;
  label: string;
  description: string;
  badgeText: string;
  enabled: boolean;
  price: number | '';
  priceOriginal: number | '';
  order: number;
  additionalFields: FieldDef[];
}

interface TemplateForm {
  planId: string;
  formTitle: string;
  submitLabel: string;
  sections: Section[];
  addons: AddonField[];
  normalizationMap: { key: string; value: string }[];
  requiredBackendFields: string;
  orderPrefix: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',      label: 'Text' },
  { value: 'email',     label: 'Email' },
  { value: 'tel',       label: 'Phone / Tel' },
  { value: 'date',      label: 'Date picker' },
  { value: 'time',      label: 'Time picker' },
  { value: 'select',    label: 'Dropdown / Select' },
  { value: 'checkbox',  label: 'Checkbox (boolean)' },
  { value: 'textarea',  label: 'Textarea' },
  { value: 'location',  label: 'Location (Google Places)' },
  { value: 'pincode',   label: 'Pin code' },
  { value: 'gender',    label: 'Gender (preset select)' },
  { value: 'language',  label: 'Language (preset select)' },
];

const uid = () => Math.random().toString(36).slice(2, 8);

const emptyField = (): FieldDef => ({
  _tempId: uid(), key: '', label: '', placeholder: '', helperText: '',
  type: 'text', options: [], gridCols: 1, order: 0, required: false,
  validation: [], showIf: [], mapTo: '', locationMeta: { latKey: '', lngKey: '' },
  hidden: false, defaultValue: '', fieldGroup: '',
});

const emptySection = (): Section => ({
  _tempId: uid(), sectionKey: '', heading: '', subheading: '',
  order: 0, showIf: [], fields: [emptyField()], collapsed: false,
});

const emptyAddon = (): AddonField => ({
  _tempId: uid(), key: '', label: '', description: '', badgeText: '',
  enabled: true, price: '', priceOriginal: '', order: 0, additionalFields: [],
});

// ─── Small reusable pieces ────────────────────────────────────────────────────

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-xs font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => {
  const { error, className, ...rest } = props;
  return (
    <>
      <input
        {...rest}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all
          ${error ? 'border-red-400' : 'border-gray-300'} ${className ?? ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
};

const Select = ({ value, onChange, children, className }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white ${className ?? ''}`}
  >
    {children}
  </select>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-red-500' : 'bg-gray-300'}`}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ─── KnownFieldPicker ─────────────────────────────────────────────────────────

const KnownFieldPicker = ({
  onSelect,
  usedKeys,
}: {
  onSelect: (field: KnownField) => void;
  usedKeys: Set<string>;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<KnownField['category'] | 'all'>('all');
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = KNOWN_FIELDS.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    const q = query.toLowerCase();
    const matchQ = !q || f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // Group by category for display
  const grouped = filtered.reduce<Record<string, KnownField[]>>((acc, f) => {
    const cat = f.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as KnownField['category'][];

  return (
    <div className="relative" ref={overlayRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all whitespace-nowrap"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Known fields
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-[340px] sm:w-[420px] overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by key, label or description…"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${activeCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_LABELS) as KnownField['category'][]).map(cat => {
              const c = CATEGORY_COLORS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                    ${isActive ? `${c.bg} ${c.text} ring-1 ring-current` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>

          {/* Field list */}
          <div className="overflow-y-auto max-h-96">
            {categories.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No fields match your search</div>
            ) : (
              categories.map(cat => (
                <div key={cat}>
                  <div className={`px-3 py-1.5 text-xs font-semibold ${CATEGORY_COLORS[cat].text} ${CATEGORY_COLORS[cat].bg} border-b border-gray-100`}>
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {grouped[cat].map(f => {
                    const alreadyUsed = usedKeys.has(f.key);
                    return (
                      <button
                        key={f.key}
                        type="button"
                        disabled={alreadyUsed}
                        onClick={() => { onSelect(f); setOpen(false); setQuery(''); }}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all border-b border-gray-50
                          ${alreadyUsed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-gray-800">{f.key}</span>
                            {f.mapTo !== f.key && (
                              <span className="text-xs text-gray-400">→ {f.mapTo}</span>
                            )}
                            {f.hidden && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" />hidden
                              </span>
                            )}
                            {f.required && (
                              <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">required</span>
                            )}
                            {alreadyUsed && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">already added</span>
                            )}
                          </div>
                          {f.label && <div className="text-xs text-gray-600 mt-0.5">{f.label}</div>}
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{f.description}</div>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">{f.type}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">Selecting a field auto-fills key, label, type, mapTo, and validation rules.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FieldEditor ─────────────────────────────────────────────────────────────

const FieldEditor = ({
  field, onChange, onDelete, sectionIndex, fieldIndex, usedKeys,
}: {
  field: FieldDef;
  onChange: (f: FieldDef) => void;
  onDelete: () => void;
  sectionIndex: number;
  fieldIndex: number;
  usedKeys: Set<string>;
}) => {
  const [open, setOpen] = useState(fieldIndex === 0);
  const up = (patch: Partial<FieldDef>) => onChange({ ...field, ...patch });

  /** Apply a KnownField to this FieldDef, filling all relevant sub-fields */
  const applyKnownField = (kf: KnownField) => {
    onChange({
      ...field,
      key: kf.key,
      label: kf.label,
      placeholder: kf.placeholder,
      type: kf.type,
      required: kf.required,
      hidden: kf.hidden ?? false,
      gridCols: kf.gridCols,
      mapTo: kf.mapTo !== kf.key ? kf.mapTo : '',
      defaultValue: kf.defaultValue ?? '',
      validation: (kf.validation ?? []) as FieldDef['validation'],
      locationMeta: kf.fills
        ? { latKey: kf.fills.latKey, lngKey: kf.fills.lngKey }
        : { latKey: '', lngKey: '' },
    });
  };

  // Keys used elsewhere (excluding this field's own key so it doesn't block itself)
  const pickerUsedKeys = new Set([...usedKeys].filter(k => k !== field.key));

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${field.hidden ? 'opacity-60 border-dashed border-gray-300' : 'border-gray-200'}`}>
      {/* Field header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all"
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {field.key && <span className="text-xs font-mono text-gray-500">{field.key}</span>}
            {field.label && <span className="text-xs text-gray-700 font-medium">{field.label}</span>}
            {!field.key && !field.label && <span className="text-xs text-gray-400 italic">Untitled field</span>}
            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{field.type}</span>
            {field.required && <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">required</span>}
            {field.hidden && <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" />hidden</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-red-400 hover:bg-red-50 rounded transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Row 1: key, label, type — with known field picker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label required>Field key</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={field.key}
                  onChange={e => up({ key: e.target.value })}
                  placeholder="e.g. dob"
                  className="flex-1"
                />
                <div onClick={e => e.stopPropagation()}>
                  <KnownFieldPicker
                    onSelect={applyKnownField}
                    usedKeys={pickerUsedKeys}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Unique ID sent in form data</p>
            </div>
            <div>
              <Label required>Label</Label>
              <Input value={field.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Date of Birth" />
            </div>
            <div>
              <Label required>Type</Label>
              <Select value={field.type} onChange={v => up({ type: v as FieldType })}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
          </div>

          {/* Row 2: placeholder, helperText, mapTo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Placeholder</Label>
              <Input value={field.placeholder} onChange={e => up({ placeholder: e.target.value })} placeholder="Shown inside input" />
            </div>
            <div>
              <Label>Helper text</Label>
              <Input value={field.helperText} onChange={e => up({ helperText: e.target.value })} placeholder="Shown below input" />
            </div>
            <div>
              <Label>Map to (backend key)</Label>
              <Input value={field.mapTo} onChange={e => up({ mapTo: e.target.value })}
                placeholder="e.g. dateOfBirth (blank = use key)" />
            </div>
          </div>

          {/* Row 3: gridCols, defaultValue, fieldGroup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Grid columns</Label>
              <Select value={String(field.gridCols)} onChange={v => up({ gridCols: Number(v) as 1 | 2 })}>
                <option value="1">1 col (half width)</option>
                <option value="2">2 cols (full width)</option>
              </Select>
            </div>
            <div>
              <Label>Default value</Label>
              <Input value={field.defaultValue} onChange={e => up({ defaultValue: e.target.value })}
                placeholder="Pre-filled value" />
            </div>
            <div>
              <Label>Field group tag</Label>
              <Input value={field.fieldGroup} onChange={e => up({ fieldGroup: e.target.value })}
                placeholder="e.g. partnerDetails" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 py-2">
            <Toggle checked={field.required} onChange={v => up({ required: v })} label="Required" />
            <Toggle checked={field.hidden} onChange={v => up({ hidden: v })} label="Hidden (sent but not shown)" />
          </div>

          {/* Location meta */}
          {field.type === 'location' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <Settings className="w-3 h-3" /> Location auto-fill keys
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude field key</Label>
                  <Input value={field.locationMeta.latKey}
                    onChange={e => up({ locationMeta: { ...field.locationMeta, latKey: e.target.value } })}
                    placeholder="e.g. birthLatitude" />
                </div>
                <div>
                  <Label>Longitude field key</Label>
                  <Input value={field.locationMeta.lngKey}
                    onChange={e => up({ locationMeta: { ...field.locationMeta, lngKey: e.target.value } })}
                    placeholder="e.g. birthLongitude" />
                </div>
              </div>
            </div>
          )}

          {/* Select options */}
          {field.type === 'select' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Dropdown options</p>
                <button type="button"
                  onClick={() => up({ options: [...field.options, { label: '', value: '' }] })}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                  + Add option
                </button>
              </div>
              {field.options.length === 0 && <p className="text-xs text-gray-400">No options yet.</p>}
              <div className="space-y-2">
                {field.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <Input value={opt.label}
                      onChange={e => {
                        const opts = [...field.options];
                        opts[oi] = { ...opts[oi], label: e.target.value };
                        up({ options: opts });
                      }}
                      placeholder="Label (shown to user)" className="flex-1" />
                    <Input value={opt.value}
                      onChange={e => {
                        const opts = [...field.options];
                        opts[oi] = { ...opts[oi], value: e.target.value };
                        up({ options: opts });
                      }}
                      placeholder="Value (sent to server)" className="flex-1" />
                    <button type="button"
                      onClick={() => up({ options: field.options.filter((_, idx) => idx !== oi) })}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-all flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show if conditions */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Show only when
                <span className="font-normal text-amber-600 ml-1">(leave empty = always shown)</span>
              </p>
              <button type="button"
                onClick={() => up({ showIf: [...field.showIf, { dependsOn: '', operator: 'eq', value: '' }] })}
                className="text-xs px-2 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all">
                + Add condition
              </button>
            </div>
            {field.showIf.map((cond, ci) => (
              <div key={ci} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Input value={cond.dependsOn}
                    onChange={e => {
                      const arr = [...field.showIf];
                      arr[ci] = { ...arr[ci], dependsOn: e.target.value };
                      up({ showIf: arr });
                    }}
                    placeholder="Field key or __planId__" />
                </div>
                <div className="col-span-3">
                  <Select value={cond.operator}
                    onChange={v => {
                      const arr = [...field.showIf];
                      arr[ci] = { ...arr[ci], operator: v as ShowIfCondition['operator'] };
                      up({ showIf: arr });
                    }}>
                    <option value="eq">equals</option>
                    <option value="neq">not equals</option>
                    <option value="truthy">is truthy</option>
                    <option value="falsy">is falsy</option>
                    <option value="in">is one of</option>
                    <option value="nin">is not one of</option>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input value={String(cond.value ?? '')}
                    onChange={e => {
                      const arr = [...field.showIf];
                      arr[ci] = { ...arr[ci], value: e.target.value };
                      up({ showIf: arr });
                    }}
                    placeholder={cond.operator === 'in' || cond.operator === 'nin' ? 'comma,separated' : 'value'} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button"
                    onClick={() => up({ showIf: field.showIf.filter((_, idx) => idx !== ci) })}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SectionEditor ────────────────────────────────────────────────────────────

const SectionEditor = ({
  section, onChange, onDelete, index, allSections,
}: {
  section: Section;
  onChange: (s: Section) => void;
  onDelete: () => void;
  index: number;
  allSections: Section[];
}) => {
  const up = (patch: Partial<Section>) => onChange({ ...section, ...patch });
  const addField = () => up({ fields: [...section.fields, emptyField()] });
  const updateField = (i: number, f: FieldDef) => {
    const fields = [...section.fields];
    fields[i] = f;
    up({ fields });
  };
  const deleteField = (i: number) => up({ fields: section.fields.filter((_, idx) => idx !== i) });

  // All keys used across all sections (so picker shows "already added" for keys in other sections too)
  const globalUsedKeys = new Set(
    allSections.flatMap(s => s.fields.map(f => f.key).filter(Boolean))
  );

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={() => up({ collapsed: !section.collapsed })}
          className="flex items-center gap-2 flex-1 text-left">
          {section.collapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          <Layers className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-gray-800 text-sm">
            {section.heading || section.sectionKey || `Section ${index + 1}`}
          </span>
          <span className="text-xs text-gray-400">{section.fields.length} field{section.fields.length !== 1 ? 's' : ''}</span>
        </button>
        <button type="button" onClick={onDelete}
          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all ml-2">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!section.collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label required>Section key</Label>
              <Input value={section.sectionKey} onChange={e => up({ sectionKey: e.target.value })} placeholder="e.g. birthDetails" />
            </div>
            <div>
              <Label>Heading</Label>
              <Input value={section.heading} onChange={e => up({ heading: e.target.value })} placeholder="e.g. Your Birth Details" />
            </div>
            <div>
              <Label>Subheading</Label>
              <Input value={section.subheading} onChange={e => up({ subheading: e.target.value })} placeholder="Optional subtitle" />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-800">
                Show entire section only when
                <span className="text-amber-600 font-normal ml-1">(empty = always shown)</span>
              </p>
              <button type="button"
                onClick={() => up({ showIf: [...section.showIf, { dependsOn: '', operator: 'eq', value: '' }] })}
                className="text-xs px-2 py-1 bg-amber-600 text-white rounded-lg">
                + Condition
              </button>
            </div>
            {section.showIf.map((cond, ci) => (
              <div key={ci} className="grid grid-cols-12 gap-2 items-center mt-2">
                <div className="col-span-4">
                  <Input value={cond.dependsOn}
                    onChange={e => {
                      const arr = [...section.showIf];
                      arr[ci] = { ...arr[ci], dependsOn: e.target.value };
                      up({ showIf: arr });
                    }}
                    placeholder="Field key or __planId__" />
                </div>
                <div className="col-span-3">
                  <Select value={cond.operator}
                    onChange={v => {
                      const arr = [...section.showIf];
                      arr[ci] = { ...arr[ci], operator: v as ShowIfCondition['operator'] };
                      up({ showIf: arr });
                    }}>
                    <option value="eq">equals</option>
                    <option value="neq">not equals</option>
                    <option value="truthy">is truthy</option>
                    <option value="falsy">is falsy</option>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input value={String(cond.value ?? '')}
                    onChange={e => {
                      const arr = [...section.showIf];
                      arr[ci] = { ...arr[ci], value: e.target.value };
                      up({ showIf: arr });
                    }}
                    placeholder="value" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button"
                    onClick={() => up({ showIf: section.showIf.filter((_, idx) => idx !== ci) })}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {section.fields.map((field, fi) => (
              <FieldEditor
                key={field._tempId}
                field={field}
                onChange={f => updateField(fi, f)}
                onDelete={() => deleteField(fi)}
                sectionIndex={index}
                fieldIndex={fi}
                usedKeys={globalUsedKeys}
              />
            ))}
          </div>

          <button type="button" onClick={addField}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add field
          </button>
        </div>
      )}
    </div>
  );
};

// ─── AddonEditor ─────────────────────────────────────────────────────────────

const AddonEditor = ({
  addon, onChange, onDelete, allSections,
}: {
  addon: AddonField;
  onChange: (a: AddonField) => void;
  onDelete: () => void;
  allSections: Section[];
}) => {
  const [open, setOpen] = useState(true);
  const up = (patch: Partial<AddonField>) => onChange({ ...addon, ...patch });

  const globalUsedKeys = new Set(
    allSections.flatMap(s => s.fields.map(f => f.key).filter(Boolean))
  );

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-3">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-gray-800 text-sm">{addon.label || addon.key || 'Untitled addon'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${addon.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
            {addon.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label required>Addon key</Label>
              <Input value={addon.key} onChange={e => up({ key: e.target.value })} placeholder="e.g. astroConsultation" /></div>
            <div><Label required>Label</Label>
              <Input value={addon.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Astro Consultation" /></div>
            <div><Label>Description</Label>
              <Input value={addon.description} onChange={e => up({ description: e.target.value })} placeholder="Short description below checkbox" /></div>
            <div><Label>Badge text</Label>
              <Input value={addon.badgeText} onChange={e => up({ badgeText: e.target.value })} placeholder="e.g. Limited Offer" /></div>
            <div><Label>Original price (₹)</Label>
              <Input type="number" value={String(addon.priceOriginal)} onWheel={e => e.currentTarget.blur()}
                onChange={e => up({ priceOriginal: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="e.g. 1999" min="0" /></div>
            <div><Label required>Add-on price (₹)</Label>
              <Input type="number" value={String(addon.price)} onWheel={e => e.currentTarget.blur()}
                onChange={e => up({ price: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="e.g. 999" min="0" /></div>
          </div>

          <Toggle checked={addon.enabled} onChange={v => up({ enabled: v })} label="Enabled by default on plan" />

          <div className="border border-gray-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700">Fields shown when this addon is checked</p>
              <button type="button"
                onClick={() => up({ additionalFields: [...addon.additionalFields, emptyField()] })}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                + Add field
              </button>
            </div>
            {addon.additionalFields.length === 0 && (
              <p className="text-xs text-gray-400">No additional fields. Add fields that should appear when user selects this add-on.</p>
            )}
            {addon.additionalFields.map((field, fi) => (
              <FieldEditor
                key={field._tempId}
                field={field}
                onChange={f => {
                  const arr = [...addon.additionalFields];
                  arr[fi] = f;
                  up({ additionalFields: arr });
                }}
                onDelete={() => up({ additionalFields: addon.additionalFields.filter((_, i) => i !== fi) })}
                sectionIndex={-1}
                fieldIndex={fi}
                usedKeys={globalUsedKeys}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Serialization helpers ────────────────────────────────────────────────────

function stripTempIds(sections: Section[]) {
  return sections.map(({ _tempId, collapsed, fields, ...s }) => ({
    ...s,
    fields: fields.map(({ _tempId: _f, ...f }) => f),
  }));
}

function stripAddonTempIds(addons: AddonField[]) {
  return addons.map(({ _tempId, additionalFields, ...a }) => ({
    ...a,
    additionalFields: additionalFields.map(({ _tempId: _f, ...f }) => f),
  }));
}

function hydrateSection(s: any): Section {
  return {
    ...s,
    _tempId: uid(),
    collapsed: false,
    fields: (s.fields || []).map((f: any) => ({ ...emptyField(), ...f, _tempId: uid() })),
  };
}

function hydrateAddon(a: any): AddonField {
  return {
    ...emptyAddon(),
    ...a,
    _tempId: uid(),
    additionalFields: (a.additionalFields || []).map((f: any) => ({ ...emptyField(), ...f, _tempId: uid() })),
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FormTemplateEditor = () => {
  const router = useRouter();
  const params = useParams();
  const planId = params?.planId as string;

  const [form, setForm] = useState<TemplateForm>({
    planId: planId || '',
    formTitle: 'Book Your Report',
    submitLabel: 'Pay with Razorpay',
    sections: [emptySection()],
    addons: [],
    normalizationMap: [],
    requiredBackendFields: 'name,email,whatsapp,reportLanguage,dateOfBirth',
    orderPrefix: '#LJR-',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'addons' | 'settings'>('sections');


  // At the top of FormTemplateEditor, add state:
const [cloneSource, setCloneSource] = useState('');
const [availableTemplates, setAvailableTemplates] = useState<{planId: string, formTitle: string}[]>([]);

// Fetch available templates to clone from
useEffect(() => {
  if (!isNew) return;
  fetch('/api/life-journey-report/form-templates', { credentials: 'include' })
    .then(r => r.json())
    .then(d => { if (d.success) setAvailableTemplates(d.templates); });
}, [isNew]);

const handleClone = async () => {
  if (!cloneSource) return;
  const res = await fetch(`/api/life-journey-report/form-templates/${cloneSource}`, { credentials: 'include' });
  const data = await res.json();
  if (data.success && data.template) {
    const t = data.template;
    setForm(prev => ({
      ...prev,
      formTitle: t.formTitle,
      submitLabel: t.submitLabel,
      sections: (t.sections || []).map(hydrateSection),
      addons: (t.addons || []).map(hydrateAddon),
      normalizationMap: Object.entries(t.normalizationMap || {}).map(([key, value]) => ({ key, value: value as string })),
      requiredBackendFields: (t.requiredBackendFields || []).join(','),
      orderPrefix: t.orderPrefix,
      // planId stays as the current new planId — don't copy it
    }));
    Swal.fire('Cloned!', `Template copied from "${cloneSource}". Review and save.`, 'success');
  }
};
  useEffect(() => {
    if (!planId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/life-journey-report/form-templates/${planId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.template) {
          const t = data.template;
          const normMap = t.normalizationMap instanceof Object && !Array.isArray(t.normalizationMap)
            ? Object.entries(t.normalizationMap).map(([key, value]) => ({ key, value: value as string }))
            : [];
          setForm({
            planId: t.planId,
            formTitle: t.formTitle || 'Book Your Report',
            submitLabel: t.submitLabel || 'Pay with Razorpay',
            sections: (t.sections || []).map(hydrateSection),
            addons: (t.addons || []).map(hydrateAddon),
            normalizationMap: normMap,
            requiredBackendFields: (t.requiredBackendFields || []).join(','),
            orderPrefix: t.orderPrefix || '#LJR-',
          });
          setIsNew(false);
        } else {
          setIsNew(true);
        }
      } catch {
        setIsNew(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planId]);

  const handleSave = async () => {
    const hasEmptyKeys = form.sections.some(s => !s.sectionKey.trim() || s.fields.some(f => !f.key.trim() || !f.label.trim()));
    if (hasEmptyKeys) {
      Swal.fire('Incomplete fields', 'All sections must have a key, and all fields must have a key and label.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const normMap: Record<string, string> = {};
      form.normalizationMap.forEach(({ key, value }) => { if (key && value) normMap[key] = value; });

      const payload = {
        planId: form.planId,
        formTitle: form.formTitle,
        submitLabel: form.submitLabel,
        sections: stripTempIds(form.sections).map((s, i) => ({ ...s, order: i })),
        addons: stripAddonTempIds(form.addons).map((a, i) => ({ ...a, order: i })),
        normalizationMap: normMap,
        requiredBackendFields: form.requiredBackendFields.split(',').map(s => s.trim()).filter(Boolean),
        orderPrefix: form.orderPrefix,
      };

      const url = `/api/life-journey-report/form-templates${isNew ? '' : `/${planId}`}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setIsNew(false);
        await Swal.fire('Saved!', isNew ? 'Template created.' : 'Template updated. Version bumped.', 'success');
      } else {
        Swal.fire('Error', data.error || 'Something went wrong.', 'error');
      }
    } catch {
      Swal.fire('Error', 'Failed to save template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const upSection = useCallback((i: number, s: Section) => {
    setForm(prev => {
      const sections = [...prev.sections];
      sections[i] = s;
      return { ...prev, sections };
    });
  }, []);

  const delSection = useCallback((i: number) => {
    setForm(prev => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== i) }));
  }, []);

  const upAddon = useCallback((i: number, a: AddonField) => {
    setForm(prev => {
      const addons = [...prev.addons];
      addons[i] = a;
      return { ...prev, addons };
    });
  }, []);

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
        <button onClick={() => router.push('/manage-form-templates')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {isNew ? 'Create form template' : 'Edit form template'}
            </h1>
            {isNew
              ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" />New</span>
              : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Saved</span>
            }
          </div>
          <p className="text-sm text-gray-500 mt-0.5 font-mono">{planId}</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-60">
          {saving
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            : <><Save className="w-4 h-4" /> {isNew ? 'Create template' : 'Save changes'}</>
          }
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['sections', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize
              ${activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
            {tab === 'sections' && <span className="ml-1.5 text-xs text-gray-400">{form.sections.length}</span>}
          </button>
        ))}
      </div>

      {isNew && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
    <Copy className="w-4 h-4 text-blue-600 flex-shrink-0" />
    <span className="text-sm text-blue-700 font-medium">Clone from existing:</span>
    <select
      value={cloneSource}
      onChange={e => setCloneSource(e.target.value)}
      className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white"
    >
      <option value="">— select a template to copy —</option>
      {availableTemplates.map(t => (
        <option key={t.planId} value={t.planId}>{t.planId} — {t.formTitle}</option>
      ))}
    </select>
    <button
      onClick={handleClone}
      disabled={!cloneSource}
      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40"
    >
      Clone
    </button>
  </div>
)}

      {/* Sections tab */}
      {activeTab === 'sections' && (
        <div>
          {form.sections.map((section, si) => (
            <SectionEditor
              key={section._tempId}
              section={section}
              onChange={s => upSection(si, s)}
              onDelete={() => delSection(si)}
              index={si}
              allSections={form.sections}
            />
          ))}
          <button type="button"
            onClick={() => setForm(prev => ({ ...prev, sections: [...prev.sections, emptySection()] }))}
            className="w-full py-3 border-2 border-dashed border-red-200 text-red-500 hover:border-red-400 hover:bg-red-50 rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-medium">
            <Plus className="w-4 h-4" /> Add section
          </button>
        </div>
      )}

      {/* Addons tab */}
      {activeTab === 'addons' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Add-ons appear as checkboxes below the main form. Each addon can reveal additional fields when checked.
          </p>
          {form.addons.map((addon, ai) => (
            <AddonEditor
              key={addon._tempId}
              addon={addon}
              onChange={a => upAddon(ai, a)}
              onDelete={() => setForm(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== ai) }))}
              allSections={form.sections}
            />
          ))}
          <button type="button"
            onClick={() => setForm(prev => ({ ...prev, addons: [...prev.addons, emptyAddon()] }))}
            className="w-full py-3 border-2 border-dashed border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50 rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-medium">
            <Plus className="w-4 h-4" /> Add addon
          </button>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Display settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Form page title</Label>
                <Input value={form.formTitle} onChange={e => setForm(prev => ({ ...prev, formTitle: e.target.value }))} placeholder="Book Your Report" /></div>
              <div><Label>Submit button label</Label>
                <Input value={form.submitLabel} onChange={e => setForm(prev => ({ ...prev, submitLabel: e.target.value }))} placeholder="Pay with Razorpay" /></div>
            </div> 
          </div>

          <div>
          <Label>Order prefix</Label>
          <Input
            value={form.orderPrefix}
            onChange={e => setForm(prev => ({ ...prev, orderPrefix: e.target.value }))}
            placeholder="e.g. #LJR-"
          />
          <p className="text-xs text-gray-400 mt-1">
            Prepended to order IDs. e.g. <code className="bg-gray-100 px-1 rounded">#LJR-</code>, <code className="bg-gray-100 px-1 rounded">#KP-</code>
          </p>
        </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-800">Normalization map</h2>
            <p className="text-xs text-gray-500">
              Maps submitted field keys to backend keys. Example: <code className="bg-gray-100 px-1 rounded">dob → dateOfBirth</code>
            </p>
            {form.normalizationMap.map((entry, ni) => (
              <div key={ni} className="flex items-center gap-2">
                <Input value={entry.key}
                  onChange={e => {
                    const arr = [...form.normalizationMap];
                    arr[ni] = { ...arr[ni], key: e.target.value };
                    setForm(prev => ({ ...prev, normalizationMap: arr }));
                  }}
                  placeholder="submitted key (e.g. dob)" className="flex-1" />
                <span className="text-gray-400 text-sm flex-shrink-0">→</span>
                <Input value={entry.value}
                  onChange={e => {
                    const arr = [...form.normalizationMap];
                    arr[ni] = { ...arr[ni], value: e.target.value };
                    setForm(prev => ({ ...prev, normalizationMap: arr }));
                  }}
                  placeholder="backend key (e.g. dateOfBirth)" className="flex-1" />
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, normalizationMap: prev.normalizationMap.filter((_, i) => i !== ni) }))}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-all flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button"
              onClick={() => setForm(prev => ({ ...prev, normalizationMap: [...prev.normalizationMap, { key: '', value: '' }] }))}
              className="text-xs px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 rounded-lg transition-all">
              + Add mapping
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-2">Required backend fields</h2>
            <p className="text-xs text-gray-500 mb-3">Comma-separated backend field names checked server-side after normalization.</p>
            <Input
              value={form.requiredBackendFields}
              onChange={e => setForm(prev => ({ ...prev, requiredBackendFields: e.target.value }))}
              placeholder="name,email,whatsapp,reportLanguage,dateOfBirth"
            />
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div className="mt-8 flex justify-end gap-3 pb-6">
        <button type="button" onClick={() => router.push('/manage-form-templates')}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-60">
          {saving
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            : <><Save className="w-4 h-4" /> {isNew ? 'Create template' : 'Save changes'}</>
          }
        </button>
      </div>
    </div>
  );
};

export default FormTemplateEditor;