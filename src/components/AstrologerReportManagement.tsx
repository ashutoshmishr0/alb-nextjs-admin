'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Check } from 'lucide-react';

interface ReportAstrologerFormData {
  isDealInReport: boolean;
}

interface ReportType {
  code: string;
  name: string;
  description: string;
}

export default function ReportAstrologerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const astrologerId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [astrologerName, setAstrologerName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [form, setForm] = useState<ReportAstrologerFormData>({
    isDealInReport: false
  });
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reportTypes: ReportType[] = [
    { code: '#LJR-', name: 'Life Journey Report', description: 'Comprehensive life path analysis' },
    { code: '#LCR-', name: 'Life Changing Report', description: 'Major life transitions and changes' },
    { code: '#LR-', name: 'Love Report', description: 'Relationship and compatibility insights' },
    { code: '#KM-', name: 'Kundli Matching', description: 'Marriage compatibility analysis' }
  ];

  useEffect(() => {
    if (astrologerId) {
      fetchAstrologerData();
    }
  }, [astrologerId]);

  const fetchAstrologerData = async () => {
    try {
      const response = await fetch(
        `/api/admin/astrologer_details_by_id`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ astrologerId })
        }
      );

      const data = await response.json();

      if (data.success) {
        const astro = data.results;
        setAstrologerName(astro.astrologerName || astro.displayName || 'Unknown');
        setIsVerified(astro.isVerified || false);
        setForm({
          isDealInReport: astro.isDealInReport || false
        });
        setSelectedReportTypes(astro.reportTypes || []);
      } else {
        Swal.fire('Error', 'Failed to load astrologer data', 'error');
      }
    } catch (error) {
      console.error('Error fetching astrologer:', error);
      Swal.fire('Error', 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (form.isDealInReport && selectedReportTypes.length === 0) {
      newErrors.reportTypes = 'Select at least one report type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (form.isDealInReport && isVerified) {
      const result = await Swal.fire({
        title: 'Warning!',
        text: 'This astrologer is currently verified for consultations. Enabling report dealing will remove their verification status. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/update-report-astrologer`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            astrologerId,
            isDealInReport: form.isDealInReport,
            reportTypes: selectedReportTypes
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        await Swal.fire('Success!', result.message || 'Settings updated successfully', 'success');
        router.push('/astrologer');
      } else {
        Swal.fire('Error', result.message || 'Failed to update', 'error');
      }
    } catch (error) {
      console.error('Error updating:', error);
      Swal.fire('Error', 'Network error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReportType = (code: string) => {
    setSelectedReportTypes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const selectAll = () => {
    setSelectedReportTypes(reportTypes.map(r => r.code));
  };

  const deselectAll = () => {
    setSelectedReportTypes([]);
  };

  const isAllSelected = selectedReportTypes.length === reportTypes.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#EF4444] mx-auto absolute inset-0"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading astrologer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pb-8">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Main Settings Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Report Writing Configuration
                </h2>
                <p className="text-red-100 mt-2">Enable and configure report writing capabilities</p>
              </div>
              <div>
                <p className="text-red-100 mt-2">{astrologerName}</p>
              </div>
            </div>

            <div className="p-8">
              {/* Enable Toggle */}
              <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all">
                <label className="flex items-start space-x-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={form.isDealInReport}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, isDealInReport: e.target.checked }));
                        if (!e.target.checked) {
                          setSelectedReportTypes([]);
                        }
                      }}
                      className="w-6 h-6 rounded-md border-2 border-gray-300 text-[#EF4444] focus:ring-4 focus:ring-red-200 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                        Enable Report Writing
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 leading-relaxed">
                      Allow this astrologer to write and deliver professional reports to clients.
                      Once enabled, you can assign specific report types based on their expertise.
                    </p>
                  </div>
                </label>
              </div>

              {/* Report Types Selection Table */}
              {form.isDealInReport && (
                <div className="animate-fadeIn">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <label className="flex items-center space-x-3 mb-2">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xl font-bold text-gray-900">
                          Assignable Report Types
                        </span>
                        <span className="text-red-500 text-xl">*</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAll}
                        disabled={isAllSelected}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAll}
                        disabled={selectedReportTypes.length === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Custom Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#EF4444] text-white">
                          <th className="w-12 px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                              className="w-5 h-5 rounded border-2 border-white text-white focus:ring-2 focus:ring-white cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-bold text-sm uppercase">Report Code</th>
                          <th className="px-4 py-3 text-left font-bold text-sm uppercase">Report Name</th>
                          <th className="px-4 py-3 text-left font-bold text-sm uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportTypes.map((report) => {
                          const isSelected = selectedReportTypes.includes(report.code);
                          return (
                            <tr
                              key={report.code}
                              onClick={() => toggleReportType(report.code)}
                              className={`border-b border-gray-100 cursor-pointer transition-all ${isSelected
                                ? 'bg-red-50 hover:bg-red-100'
                                : 'bg-white hover:bg-gray-50'
                                }`}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center">
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                      ? 'bg-[#EF4444] border-[#EF4444]'
                                      : 'border-gray-300 bg-white'
                                      }`}
                                  >
                                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`font-bold text-sm ${isSelected ? 'text-[#EF4444]' : 'text-gray-700'}`}>
                                  {report.code}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {report.name}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-gray-600 text-sm">{report.description}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>


                  {errors.reportTypes && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mt-4">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700 font-medium">{errors.reportTypes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white rounded-xl shadow-lg border border-gray-200 px-8 py-4">
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2"
                disabled={submitting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
