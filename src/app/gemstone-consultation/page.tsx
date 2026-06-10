"use client";

import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { User, Calendar, Phone, Mail, MessageSquare, CheckCircle, Clock, XCircle, Eye, X, Loader2 } from "lucide-react";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import DownloadIcon from "@mui/icons-material/Download";
import MainDatatable from "@/components/common/MainDatatable";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface GemstoneConsultation {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  DateofBirth: string;
    timeOfBirth: string; // ✅ add this

  Status: "Paid" | "Unpaid";
  Action: string;
  createdAt: string;
  updatedAt: string;
}

// Deep search function for client-side filtering
const DeepSearchSpace = (
  data: GemstoneConsultation[],
  searchText: string
): GemstoneConsultation[] => {
  if (!searchText) return data;

  const searchLower = searchText.toLowerCase();
  return data.filter((item) => {
    const searchableFields = [
      item?.name,
      item?.email,
      item?.phone,
      item?.message,
        item?.timeOfBirth, // ✅

      item?.Status,
      item?.Action,
      moment(item?.DateofBirth).format("DD/MM/YYYY"),
    ];

    return searchableFields.some(
      (val) => val && String(val).toLowerCase().includes(searchLower)
    );
  });
};

export default function GemstoneConsultationPage() {
  const [allData, setAllData] = useState<GemstoneConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: GemstoneConsultation | null;
  }>({ open: false, data: null });
  
  const [filters, setFilters] = useState({
    status: "",
    startDate: moment().format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });

  const convertToAPIFormat = (dateStr: string) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.set('startDate', convertToAPIFormat(filters.startDate));
        params.set('endDate', convertToAPIFormat(filters.endDate));
        
        const url = `/api/admin/gemstones-consultation-date?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setAllData(result.data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching consultations:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.startDate, filters.endDate]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Date validation
    if (name === "startDate" && filters.endDate && value > filters.endDate) {
      alert("Start date cannot be after end date");
      return;
    }

    if (name === "endDate" && filters.startDate && value < filters.startDate) {
      alert("End date cannot be before start date");
      return;
    }
    
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const filteredConsultations = useMemo(() => {
    let filtered = allData;
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.Status === filters.status);
    }
    
    // Apply search
    filtered = DeepSearchSpace(filtered, searchText);
    
    return filtered;
  }, [allData, filters.status, searchText]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Paid':
        return {
          label: 'Paid',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'Unpaid':
        return {
          label: 'Unpaid',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: <XCircle className="w-3.5 h-3.5" />
        };
    }
  };

  const openViewModal = (consultation: GemstoneConsultation) => {
    setViewModal({ open: true, data: consultation });
  };

  const closeViewModal = () => {
    setViewModal({ open: false, data: null });
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      startDate: moment().format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
    });
    setSearchText("");
  };

  const prepareCSVData = (data: GemstoneConsultation[]) => {
    return data.map((item, index) => ({
      "S.No.": index + 1,
      "Name": item?.name || "N/A",
      "Email": item?.email || "N/A",
      "Phone": item?.phone || "N/A",
      "Message": item?.message || "N/A",
      "Date of Birth": item?.DateofBirth ? moment(item.DateofBirth).format("DD/MM/YYYY") : "N/A",
      "Time of Birth": item?.timeOfBirth || "N/A",
      "Payment Status": item?.Status || "N/A",
      "Action Status": item?.Action || "N/A",
      "Created At": item?.createdAt
        ? moment(item.createdAt).format("DD/MM/YYYY HH:mm:ss")
        : "N/A",
      "Updated At": item?.updatedAt
        ? moment(item.updatedAt).format("DD/MM/YYYY HH:mm:ss")
        : "N/A",
    }));
  };
const columns = useMemo(() => [
  {
    name: 'S.No.',
    selector: (_row: any, index?: number) => (index !== undefined ? index + 1 : 0),
    cell: (_row: any, index?: number) => (
      <div className="text-sm text-gray-900 font-semibold">
        {index !== undefined ? index + 1 : 0}
      </div>
    ),
    width: '70px',  // ✅ Reduced from 80px
    maxWidth: '140px', 
  },
  {
    name: 'Customer',
    selector: (row: GemstoneConsultation) => row.name,
    cell: (row: GemstoneConsultation) => (
      <div className="flex items-center gap-3 py-2">
        <div>
          <div className="font-medium text-gray-900 text-sm">{row.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      </div>
    ),
    width: '380px',  // ✅ Increased from 250px
  },
  {
  name: 'Email',
  selector: (row: GemstoneConsultation) => row.email, // ✅ Keep simple selector
  cell: (row: GemstoneConsultation) => {
    const email = row?.email?.trim() || "N/A";
    return (
      <div className="text-sm text-gray-900 truncate max-w-[220px]"> {/* ✅ Fixed width */}
        <Tooltip title={email}>
          <span>{email}</span>
        </Tooltip>
      </div>
    );
  },
  width: '240px', // ✅ Increased from 240px
  minWidth: '240px', // ✅ Add explicit minWidth
},
  {
    name: 'Date of Birth',
    selector: (row: GemstoneConsultation) => row.DateofBirth,
    cell: (row: GemstoneConsultation) => (
      <div className="text-sm text-gray-900 flex items-center gap-2">
        {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
        {moment(row.DateofBirth).format('DD/MM/YYYY')}
      </div>
    ),
    width: '160px',
  },
  {
  name: 'Time of Birth',
  selector: (row: GemstoneConsultation) => row.timeOfBirth,
  cell: (row: GemstoneConsultation) => (
    <div className="text-sm text-gray-900">
      {row.timeOfBirth || 'N/A'}
    </div>
  ),
  width: '140px',
},
  {
    name: 'Created At',
    selector: (row: GemstoneConsultation) => row.createdAt,
    cell: (row: GemstoneConsultation) => (
      <div className="text-sm text-gray-900">
        {moment(row.createdAt).format('DD/MM/YYYY HH:mm')}
      </div>
    ),
    sortable: true,
    width: '150px',
  },
  {
    name: 'Actions',
    cell: (row: GemstoneConsultation) => (
      <button
        onClick={() => openViewModal(row)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
      >
        <Eye className="w-3.5 h-3.5" />
        View
      </button>
    ),
    width: '100px',
  },
], []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 mb-2 text-xl font-semibold">Error loading data</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 bg-white rounded-lg border border-gray-200">
        <div className="mb-5">
          <div className="flex justify-between items-center mb-5 bg-white">
            <div className="text-xl font-semibold text-gray-800">
              Gemstone Consultations
            </div>

            <div className="flex gap-3 items-center">
              {allData.length > 0 && (
                <CSVLink
                  filename="Gemstone_Consultations.csv"
                  data={prepareCSVData(filteredConsultations)}
                  className="text-gray-800 text-base no-underline flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  <DownloadIcon className="text-gray-600" />
                </CSVLink>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              max={filters.endDate || undefined}
              placeholder="Created From"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              min={filters.startDate || undefined}
              placeholder="Created To"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <input
              type="text"
              placeholder="Search across all fields..."
              value={searchText}
              onChange={handleSearch}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent flex-1 min-w-[250px]"
            />

            {(filters.status ||
              filters.startDate ||
              filters.endDate ||
              searchText) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <MainDatatable
          columns={columns.map((col) => ({
            ...col,
            minwidth: col.width,
            width: undefined,
          }))}
          data={filteredConsultations}
          isLoading={loading}
          title=""
          addButtonActive={false}
          showSearch={false}
        />
      </div>

      {/* View Modal - Simplified */}
      {viewModal.open && viewModal.data && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      {/* Modal Header */}
      <div className="bg-red-600 p-6 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Consultation Details
          </h2>
        </div>
        <button 
          onClick={closeViewModal} 
          className="p-2 hover:bg-red-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-6">
        {/* Personal Information - Full Width */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <User className="w-4 h-4 text-red-600" />
            Personal Information
          </h4>
          <div className="space-y-3">
            <DetailRow label="Full Name" value={viewModal.data.name} />
            <DetailRow 
              label="Email" 
              value={viewModal.data.email}
            />
            <DetailRow 
              label="Phone" 
              value={viewModal.data.phone}
            />
            <DetailRow 
              label="Date of Birth" 
              value={moment(viewModal.data.DateofBirth).format('DD/MM/YYYY')}
            />
            <DetailRow 
  label="Time of Birth" 
  value={viewModal.data.timeOfBirth || "N/A"}
/>
            <DetailRow 
              label="Consultation ID" 
              value={viewModal.data._id}
            />
          </div>
        </div>

        {/* Consultation Message - Full Width */}
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-600" />
            Consultation Message
          </h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
            {viewModal.data.message}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 rounded-b-lg">
        <button
          onClick={closeViewModal}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
}

// Helper Component for Detail Rows
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600 font-medium">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);
