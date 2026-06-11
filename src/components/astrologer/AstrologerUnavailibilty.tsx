// components/astrologer/ReportsAndAvailability.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, Clock, Trash2, CalendarOff, Loader2, FileText } from 'lucide-react';

interface BlockedTimeRange {
  _id: string;
  date: string;
  timeRange: string;
  prefix: string | null;
  blockedBy: string;
  isActive: boolean;
  createdAt: string;
}

interface ReportType {
  code: string;
  name: string;
}

interface ReportsAndAvailabilityProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function ReportsAndAvailability({ astrologerId, initialData, onUpdate }: ReportsAndAvailabilityProps) {
  // Report Configuration State
  const [isDealInReport, setIsDealInReport] = useState(initialData?.isDealInReport || false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>(initialData?.reportTypes || []);
  const [originalReportSettings, setOriginalReportSettings] = useState({
    isDealInReport: initialData?.isDealInReport || false,
    reportTypes: initialData?.reportTypes || []
  });

  // Unavailability State
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isFullDayBlock, setIsFullDayBlock] = useState(true);
  const [startTime, setStartTime] = useState('10:00AM');
  const [endTime, setEndTime] = useState('7:00PM');
  const [blockedRanges, setBlockedRanges] = useState<BlockedTimeRange[]>([]);

  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const reportTypes: ReportType[] = [
    { code: '#LJR-', name: 'Life Journey Report' },
    { code: '#LCR-', name: 'Life Changing Report' },
    { code: '#LR-', name: 'Love Report' },
    { code: '#KM-', name: 'Kundli Matching' },
    { code: '#NNR-', name: 'Name Number Report' },
    { code: '#VR-', name: 'Varshphal Report' },
    { code: '#BNR-', name: 'Baby Name Report' },
    { code: '#KSD', name: 'Kaal Saarp Report' },
    { code: '#BPR', name: 'Bussiness Partner Report' },
    { code: '#SSR', name: 'Sade Sati Report' },
    { code: '#WR', name: 'Wealth Report' },
    { code: '#GR', name: 'Government Report' }
  ];

  const timeOptions = [
    '10:00AM', '10:30AM', '11:00AM', '11:30AM',
    '12:00PM', '12:30PM', '1:00PM', '1:30PM',
    '2:00PM', '2:30PM', '3:00PM', '3:30PM',
    '4:00PM', '4:30PM', '5:00PM', '5:30PM',
    '6:00PM', '6:30PM', '7:00PM'
  ];

  useEffect(() => {
    if (isDealInReport) {
      fetchBlockedRanges();
    }
  }, [selectedDate, isDealInReport]);

  const fetchBlockedRanges = async () => {
    setLoadingBlocks(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        astrologerId: astrologerId
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        const allReportBlocks = (data.blockedSlots || []).filter(
          (block: BlockedTimeRange) => block.prefix === null
        );
        setBlockedRanges(allReportBlocks);
      }
    } catch (error) {
      console.error('Error fetching blocked ranges:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const toggleReportType = (code: string) => {
    setSelectedReportTypes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const selectAllReports = () => {
    setSelectedReportTypes(reportTypes.map(r => r.code));
  };

  const deselectAllReports = () => {
    setSelectedReportTypes([]);
  };

  const hasReportChanges = () => {
    return (
      isDealInReport !== originalReportSettings.isDealInReport ||
      JSON.stringify(selectedReportTypes.sort()) !== JSON.stringify(originalReportSettings.reportTypes.sort())
    );
  };

  const handleSaveReportSettings = async () => {
    if (!hasReportChanges()) {
      toast.info('No changes to save');
      return;
    }

    if (isDealInReport && selectedReportTypes.length === 0) {
      toast.error('Select at least one report type');
      return;
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
            isDealInReport,
            reportTypes: selectedReportTypes
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Report settings updated successfully');
        setOriginalReportSettings({
          isDealInReport,
          reportTypes: [...selectedReportTypes]
        });
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockTimeRange = async () => {
    if (!isFullDayBlock && (!startTime || !endTime)) {
      toast.error("Please select start and end time");
      return;
    }

    if (!isFullDayBlock && startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setBlocking(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/block-astrologer-time-range`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            startTime: isFullDayBlock ? null : startTime,
            endTime: isFullDayBlock ? null : endTime,
            astrologerId: astrologerId,
            prefix: null,
            blockedBy: 'Astrologer'
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Unavailability marked successfully");
        await fetchBlockedRanges();
        setIsFullDayBlock(true);
        setStartTime('10:00AM');
        setEndTime('7:00PM');
      } else {
        toast.error(data.message || "Failed to mark unavailability");
      }
    } catch (error) {
      console.error('Error blocking time range:', error);
      toast.error("An error occurred");
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockRange = async (blockId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots/${blockId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Unavailability removed successfully");
        await fetchBlockedRanges();
      } else {
        toast.error(data.message || "Failed to remove");
      }
    } catch (error) {
      console.error('Error unblocking:', error);
      toast.error("An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isAllSelected = selectedReportTypes.length === reportTypes.length;

  return (
    <div className="space-y-6">
      {/* <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-1">Reports & Availability</h3>
        <p className="text-gray-600 text-sm">Configure report writing capabilities and manage availability</p>
      </div> */}

      {/* Report Configuration Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        {/* Enable Toggle */}
        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-red-300 transition-all">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDealInReport}
              onChange={(e) => {
                setIsDealInReport(e.target.checked);
                if (!e.target.checked) {
                  setSelectedReportTypes([]);
                }
              }}
              className="w-5 h-5 rounded border-2 border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500 mt-0.5"
            />
            <div>
              <span className="text-base font-semibold text-gray-900">Enable Report Writing</span>
              <p className="text-sm text-gray-600 mt-1">
                Allow this astrologer to write and deliver professional reports to clients
              </p>
            </div>
          </label>
        </div>

        {/* Report Types Selection - Simplified */}
        {isDealInReport && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                Select Report Types <span className="text-red-500">*</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllReports}
                  disabled={isAllSelected}
                  className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllReports}
                  disabled={selectedReportTypes.length === 0}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {reportTypes.map((report) => {
                const isSelected = selectedReportTypes.includes(report.code);
                return (
                  <label
                    key={report.code}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isSelected
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-gray-300 hover:border-red-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleReportType(report.code)}
                      className="hidden"
                    />
                    <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-red-600' : 'border-2 border-gray-300'
                      }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {report.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasReportChanges() && (
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleSaveReportSettings}
              disabled={submitting}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Report Settings
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Unavailability Section - Only show if reports are enabled */}
      {isDealInReport && (
        <>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Mark Unavailability</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300 cursor-pointer hover:border-red-400 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={isFullDayBlock}
                    onChange={(e) => setIsFullDayBlock(e.target.checked)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Block entire day (10:00 AM - 7:00 PM)
                  </span>
                </label>
              </div>

              {!isFullDayBlock && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleBlockTimeRange}
              disabled={blocking}
              className="w-full mt-4 px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {blocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CalendarOff className="w-4 h-4" />
                  {isFullDayBlock ? 'Block Full Day' : 'Block Time Range'}
                </>
              )}
            </button>
          </div>

          {/* Blocked Ranges Display */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Unavailability for {formatDate(selectedDate)}
              </h3>
              {blockedRanges.length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {blockedRanges.length} block(s)
                </span>
              )}
            </div>

            {loadingBlocks ? (
              <div className="text-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            ) : blockedRanges.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No unavailability marked for this date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedRanges.map((block) => (
                  <div
                    key={block._id}
                    className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-gray-900">{block.timeRange}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblockRange(block._id)}
                      className="px-3 py-1 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
