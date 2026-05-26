import React, { useMemo } from "react";
import { Filters } from "../types";

// ✅ Report type options mapped to order ID prefixes
const REPORT_TYPE_OPTIONS = [
  { label: "All Reports",                 value: "all"    },
  { label: "Life Journey Report",        value: "#LJR-"   },
  { label: "Vedic Life Report",           value: "#VLR-"  },
  { label: "Career Report",               value: "#CR-"  },
  { label: "Vedic Health Report",         value: "#VHR-"  },
  { label: "Marriage Love Life Report",   value: "#MLR-"  },
  { label: "Wealth & Finance Report",     value: "#WR-"   },
  { label: "Education & Academic Report", value: "#EAR-"  },
  { label: "Baby Name Report",         value: "#BNR-"  },
  { label: "Business Partnership Report", value: "#BPR-"  },
  { label: "Nakshatra Analysis Report",   value: "#NAR-"  },
  { label: "Sade Sati Report",            value: "#SSR-"  },
  { label: "Mangal Dosha Report",         value: "#MDR-"  },
  { label: "Kaal Sarp Dosha Report",      value: "#KSD-"  },
  { label: "Pitra Dosha Report",          value: "#PDR-"  },
  { label: "Comprehensive Dosha Report", value: "#CDRR-" },
  { label: "Government Job Report",        value: "#GR-"   },
  { label: "Love Report",        value: "#LR-"   },
  { label: "Kundli Match Report",        value: "#KM-"   },
  { label: "Varshphal Report",        value: "#VR-"   },
];

interface Props {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
  onRefresh: () => void;
  onReset: () => void;
  onProcessSelected: () => void;
  selectedCount: number;
}

export const FilterBar: React.FC<Props> = ({
  filters,
  onChange,
  onRefresh,
  onReset,
  onProcessSelected,
  selectedCount,
}) => {
  const todayDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email, phone..."
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
        className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-w-[200px]"
      />

      {/* Date Filters */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Date:</span>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ from: e.target.value })}
          className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="From date"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
          className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="To date"
        />
        {(filters.from || filters.to) && (
          <button
            onClick={() => onChange({ from: "", to: "" })}
            className="text-red-500 hover:text-red-700 text-xs"
            title="Clear dates"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ✅ Report Type Dropdown (replaces planName) */}
      <select
        value={filters.reportType}
        onChange={(e) => onChange({ reportType: e.target.value })}
        className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-w-[200px]"
      >
        {REPORT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Report Delivery Status */}
      <select
        value={filters.reportDeliveryStatus}
        onChange={(e) => onChange({ reportDeliveryStatus: e.target.value })}
        className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-w-[140px]"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="delivered">Delivered</option>
        <option value="failed">Failed</option>
      </select>

      {/* Language */}
      <select
        value={filters.language}
        onChange={(e) => onChange({ language: e.target.value })}
        className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-w-[120px]"
      >
        <option value="all">All Languages</option>
        <option value="english">English</option>
        <option value="hindi">Hindi</option>
      </select>

      {/* Auto-Select First N */}
      <div className="relative">
        <input
          type="number"
          placeholder="Auto-select first N..."
          value={filters.selectFirstN || ""}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            onChange({ selectFirstN: value });
          }}
          min="1"
          max="1000"
          className="px-3 py-2 border-2 border-purple-500 rounded-md focus:ring-2 focus:ring-purple-600 min-w-[180px] bg-purple-50 font-semibold text-purple-800"
          title="Auto-select first N non-delivered reports"
        />
        {filters.selectFirstN && filters.selectFirstN > 0 && (
          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
            {filters.selectFirstN}
          </span>
        )}
      </div>

      {/* Process Selected Button */}
      {selectedCount > 0 && (
        <button
          onClick={onProcessSelected}
          className="px-4 py-2 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-md"
        >
          <span>⚡</span>
          Process {selectedCount} Report{selectedCount > 1 ? "s" : ""}
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          Refresh
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          ↺ Reset
        </button>
      </div>

      {/* Info text */}
      {filters.selectFirstN && filters.selectFirstN > 0 && (
        <div className="text-xs text-purple-600 font-medium mt-1 w-full bg-purple-50 px-3 py-1 rounded">
          ⓘ Auto-selected first {selectedCount} non-delivered reports
        </div>
      )}
    </div>
  );
};