/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import MainDatatable from '@/components/common/MainDatatable';
import { Tooltip } from '@mui/material';
import { CSVLink } from 'react-csv';
import { Calendar, Filter, Download, Info } from 'lucide-react';

// Updated Types with earningBreakdown
interface CustomerDetails {
  _id: string;
  customerName: string;
  email: string;
  phoneNumber: string;
}

interface AstrologerDetails {
  _id: string;
  astrologerName: string;
  email?: string;
  isLive?: boolean;
}

interface EarningBreakdown {
  totalPaidByUser: number;
  gstAmount: number;
  netAmount: number;
  astrologerShareBeforeTDS: number;
  tdsAmount: number;
  payableToAstrologer: number;
  adminShare: number;
  astrologerEarningPercentage: number;
  tdsPercentage: number;
}

interface AdminEarningRow {
  _id: string;
  type: string;
  astrologerId: string | null | AstrologerDetails;
  customerId: CustomerDetails | null;
  transactionId: string;
  totalPrice: string;
  adminPrice: string;
  partnerPrice: string;
  duration: number;
  chargePerMinutePrice: number;
  startTime: string;
  endTime: string;
  transactionType: string;
  createdAt: string;
  updatedAt: string;
  earningBreakdown?: EarningBreakdown;
  paymentStatus?: string;
}

// Utility functions
const IndianRupee = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Helper function to get astrologer name
const getAstrologerName = (astrologerId: string | null | AstrologerDetails): string => {
  if (!astrologerId) return 'N/A';
  if (typeof astrologerId === 'object' && astrologerId !== null) {
    return (astrologerId as AstrologerDetails).astrologerName || 'N/A';
  }
  return 'N/A';
};

// Helper function to check if astrologer is in-house
// FIXED: isLive = true means In-house, isLive = false means Outside
const isInHouse = (astrologerId: string | null | AstrologerDetails): boolean => {
  if (!astrologerId) return false;
  if (typeof astrologerId === 'object' && astrologerId !== null) {
    return !!(astrologerId as any).isLive; // In-house when isLive is TRUE
  }
  return false;
};

// Helper function to format type
const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'live_video_call': 'Live Call',
    'consultation': 'Consultation',
    'puja': 'Puja',
    'chat': 'Chat',
    'call': 'Call',
    'video_call': 'Video Call'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Check if has earningBreakdown
const hasEarningBreakdown = (row: AdminEarningRow): boolean => {
  return !!row.earningBreakdown && Object.keys(row.earningBreakdown).length > 0 && typeof row.earningBreakdown === 'object';
};

// Frontend Search Filter Function
const searchFilterData = (data: AdminEarningRow[], searchText: string): AdminEarningRow[] => {
  if (!searchText.trim()) return data;

  const searchLower = searchText.toLowerCase();
  return data.filter((item) => {
    const astrologerName = getAstrologerName(item.astrologerId).toLowerCase();
    const customerName = item.customerId?.customerName?.toLowerCase() || '';
    const customerEmail = item.customerId?.email?.toLowerCase() || '';
    const typeFormatted = formatType(item.type).toLowerCase();
    const transactionId = item.transactionId.toLowerCase();
    const totalPrice = item.totalPrice;
    const adminPrice = item.adminPrice;
    const partnerPrice = item.partnerPrice;
    const duration = item.duration.toString();

    return (
      astrologerName.includes(searchLower) ||
      customerName.includes(searchLower) ||
      customerEmail.includes(searchLower) ||
      typeFormatted.includes(searchLower) ||
      transactionId.includes(searchLower) ||
      totalPrice.includes(searchLower) ||
      adminPrice.includes(searchLower) ||
      partnerPrice.includes(searchLower) ||
      duration.includes(searchLower)
    );
  });
};

const AdminEarning: React.FC = () => {
  const [allAdminEarningData, setAllAdminEarningData] = useState<AdminEarningRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'Consultation' | 'puja',
    startDate: '',
    endDate: '',
    location: 'all' as 'all' | 'in-house' | 'outside',
    paymentStatus: 'all' as 'all' | 'paid' | 'unpaid',
  });

  const [searchText, setSearchText] = useState('');

  // Add dummy payment status to data
  useEffect(() => {
    if (allAdminEarningData.length > 0) {
      setAllAdminEarningData(prev => prev.map(item => ({
        ...item,
        paymentStatus: Math.random() > 0.5 ? 'paid' : 'unpaid'
      }))
      );
    }
  }, []);

  // Filtered data with all filters
  const filteredData = useMemo(() => {
    let filtered = [...allAdminEarningData];

    // FIXED: Type filter - Consultation shows all except puja, puja shows only puja
    if (filters.type !== 'all') {
      if (filters.type === 'puja') {
        // Show only puja
        filtered = filtered.filter(item => item.type.toLowerCase() === 'puja');
      } else if (filters.type === 'Consultation') {
        // Show everything except puja
        filtered = filtered.filter(item => item.type.toLowerCase() !== 'puja');
      }
    }

    // Apply location filter (In-house/Outside)
    if (filters.location !== 'all') {
      filtered = filtered.filter(item => {
        const inHouse = isInHouse(item.astrologerId);
        return filters.location === 'in-house' ? inHouse : !inHouse;
      });
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(item =>
        item.paymentStatus === filters.paymentStatus
      );
    }

    // Apply search filter
    filtered = searchFilterData(filtered, searchText);

    return filtered;
  }, [allAdminEarningData, filters.type, filters.location, filters.paymentStatus, searchText]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const breakdown = item.earningBreakdown;
      const total = parseFloat(item.totalPrice || '0');
      const admin = parseFloat(item.adminPrice || '0');
      const partner = parseFloat(item.partnerPrice || '0');

      return {
        total: acc.total + total,
        admin: acc.admin + admin,
        partner: acc.partner + partner,
        tds: acc.tds + (breakdown?.tdsAmount || 0),
        gst: acc.gst + (breakdown?.gstAmount || 0),
        net: acc.net + (breakdown?.netAmount || 0),
      };
    }, { total: 0, admin: 0, partner: 0, tds: 0, gst: 0, net: 0 });
  }, [filteredData]);

  // CSV Data for ALL records export
  const prepareCSVData = useMemo(() => {
    return filteredData.map((item, index) => {
      const breakdown = item.earningBreakdown;
      const hasBreakdown = hasEarningBreakdown(item);

      return {
        "S.No.": index + 1,
        "Date": item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY') : 'N/A',
        "Time": item.createdAt ? moment(item.createdAt).format('hh:mm A') : 'N/A',
        "Type": formatType(item.type),
        "Astrologer": getAstrologerName(item.astrologerId),
        "Location": isInHouse(item.astrologerId) ? 'In-house' : 'Outside',
        "Customer Name": item.customerId?.customerName || 'N/A',
        "Customer Email": item.customerId?.email || 'N/A',
        "Customer Phone" :item.customerId?.phoneNumber || 'N/A',
        "Total Amount": hasBreakdown ? breakdown?.totalPaidByUser || item.totalPrice : item.totalPrice,
        "GST Amount": hasBreakdown ? breakdown?.gstAmount || 0 : 0,
        "Net Amount (After GST)": hasBreakdown ? breakdown?.netAmount || 0 : item.totalPrice,
        "Admin Share": hasBreakdown ? breakdown?.adminShare || item.adminPrice : item.adminPrice,
        "Astrologer Share": hasBreakdown ? breakdown?.astrologerShareBeforeTDS || item.partnerPrice : item.partnerPrice,
        "TDS (2%)": hasBreakdown ? breakdown?.tdsAmount || 0 : 0,
        "Astrologer Earning After TDS": hasBreakdown ? breakdown?.payableToAstrologer || item.partnerPrice : item.partnerPrice,
        // "Payment Status": item.paymentStatus || 'unpaid',
        // "Duration (min)": item.duration || 0,
        "Transaction ID": item.transactionId || 'N/A',
      };
    });
  }, [filteredData]);

  // API function to fetch admin earnings
  const fetchAdminEarnings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.type !== 'all') params.set('type', filters.type);

      const url = `/api/admin/get_admin_earnig_history2?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch admin earnings');
      }

      const data = await response.json();
      const sortedHistory = (data.history || []).sort(
        (a: AdminEarningRow, b: AdminEarningRow) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Add dummy payment status
      const historyWithPaymentStatus = sortedHistory.map((item: AdminEarningRow) => ({
        ...item,
        paymentStatus: Math.random() > 0.5 ? 'paid' : 'unpaid'
      }));

      setAllAdminEarningData(historyWithPaymentStatus);
    } catch (error) {
      console.error('Error fetching admin earnings:', error);
      setAllAdminEarningData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdminEarnings();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.startDate, filters.endDate, filters.type]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
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

    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      location: 'all',
      paymentStatus: 'all',
    });
    setSearchText('');
  };

  // DataTable Columns - UPDATED with removed icons from location
  const columns = useMemo(() => [
    {
      name: 'S.No.',
      selector: (row: AdminEarningRow, rowIndex?: number) => (rowIndex ?? 0) + 1,
      width: '70px',
      cell: (row: AdminEarningRow, rowIndex?: number) => (
        <div className="text-center font-medium text-gray-700">
          {(rowIndex ?? 0) + 1}
        </div>
      ),
      sortable: false,
    },
    {
      name: 'Date & Time',
      selector: (row: AdminEarningRow) => row?.createdAt || '',
      cell: (row: AdminEarningRow) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {row?.createdAt ? moment(row?.createdAt).format('DD/MM/YYYY') : 'N/A'}
          </span>
          <span className="text-xs text-gray-500">
            {row?.createdAt ? moment(row?.createdAt).format('hh:mm A') : ''}
          </span>
        </div>
      ),
      width: '140px',
      sortable: true,
    },
    {
      name: 'Type',
      selector: (row: AdminEarningRow) => formatType(row?.type),
      cell: (row: AdminEarningRow) => (
        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
          {formatType(row?.type)}
        </div>
      ),
      width: '130px',
      sortable: true,
    },
    {
      name: 'Location',
      selector: (row: AdminEarningRow) => isInHouse(row.astrologerId) ? 'In-house' : 'Outside',
      cell: (row: AdminEarningRow) => (
        <div className="flex items-center gap-1">
          {isInHouse(row.astrologerId) ? (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
              In-house
            </span>
          ) : (
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium">
              Outside
            </span>
          )}
        </div>
      ),
      width: '130px',
      sortable: true,
    },
    {
      name: 'Astrologer',
      selector: (row: AdminEarningRow) => getAstrologerName(row?.astrologerId),
      cell: (row: AdminEarningRow) => (
        <span className="font-medium text-gray-800">
          {getAstrologerName(row?.astrologerId)}
        </span>
      ),
      width: '140px',
      sortable: true,
    },
    {
      name: 'Customer',
      selector: (row: AdminEarningRow) => row?.customerId?.customerName || 'N/A',
      cell: (row: AdminEarningRow) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {row?.customerId?.customerName }
          </span>
          {row?.customerId?.email && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]">
              {row.customerId.email}
            </span>
          )}
          {row?.customerId?.phoneNumber && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]">
              {row.customerId.phoneNumber}
            </span>
          )}
        </div>
      ),
      width: '160px',
      sortable: true,
    },
    {
      name: 'Gross Amount',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.totalPaidByUser) {
          return row.earningBreakdown.totalPaidByUser;
        }
        return parseFloat(row?.totalPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;

        return (
          <div className="font-semibold text-gray-900">
            {IndianRupee(hasBreakdown ? breakdown?.totalPaidByUser || row.totalPrice : row.totalPrice)}
          </div>
        );
      },
      width: '150px',
      sortable: true,
    },
    {
      name: 'GST (18%)',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row)) {
          return row.earningBreakdown?.gstAmount || 0;
        }
        return 0;
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;

        if (!hasBreakdown || !breakdown?.gstAmount) {
          return <span className="text-gray-400">-</span>;
        }

        return (
          <div className="text-orange-600 font-medium">
            {IndianRupee(breakdown.gstAmount)}
          </div>
        );
      },
      width: '130px',
      sortable: true,
    },
    {
      name: 'Taxable Amount',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.netAmount) {
          return row.earningBreakdown.netAmount;
        }
        return parseFloat(row?.totalPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown: any = row.earningBreakdown;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {IndianRupee(hasBreakdown ? breakdown?.netAmount || row.totalPrice : row.totalPrice)}
            </span>
            {hasBreakdown && breakdown?.gstAmount > 0 && (
              <span className="text-xs text-gray-500">
                (After GST)
              </span>
            )}
          </div>
        );
      },
      width: '130px',
      sortable: true,
    },
    {
      name: 'Admin Share',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.adminShare) {
          return row.earningBreakdown.adminShare;
        }
        return parseFloat(row?.adminPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-blue-600">
              {IndianRupee(hasBreakdown ? breakdown?.adminShare || row.adminPrice : row.adminPrice)}
            </span>
            {hasBreakdown && (
              <span className="text-xs text-gray-500">
                ({100 - (breakdown?.astrologerEarningPercentage || 0)}%)
              </span>
            )}
          </div>
        );
      },
      width: '138px',
      sortable: true,
    },
    {
      name: 'Astro Share',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.astrologerShareBeforeTDS) {
          return row.earningBreakdown.astrologerShareBeforeTDS;
        }
        return parseFloat(row?.partnerPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-purple-600">
              {IndianRupee(hasBreakdown ? breakdown?.astrologerShareBeforeTDS || row.partnerPrice : row.partnerPrice)}
            </span>
            {hasBreakdown && (
              <span className="text-xs text-gray-500">
                ({breakdown?.astrologerEarningPercentage || 0}%)
              </span>
            )}
          </div>
        );
      },
      width: '130px',
      sortable: true,
    },
    {
      name: 'TDS',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row)) {
          return row.earningBreakdown?.tdsAmount || 0;
        }
        return 0;
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;

        if (!hasBreakdown || !breakdown?.tdsAmount) {
          return <span className="text-gray-400">-</span>;
        }

        return (
          <div className="flex flex-col text-red-600">
            <span className="font-medium">{IndianRupee(breakdown.tdsAmount)}</span>
            <span className="text-xs">({breakdown.tdsPercentage}%)</span>
          </div>
        );
      },
      width: '80px',
      sortable: true,
    },
    {
      name: 'Astro Net',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.payableToAstrologer) {
          return row.earningBreakdown.payableToAstrologer;
        }
        return parseFloat(row?.partnerPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const inHouse = isInHouse(row.astrologerId);
        
        // For in-house astrologers, show dash
        if (inHouse) {
          return <span className="text-gray-400">-</span>;
        }

        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown: any = row.earningBreakdown;

        return (
          <div className={`font-semibold ${breakdown?.tdsAmount > 0 ? 'text-green-700' : 'text-green-600'}`}>
            {IndianRupee(hasBreakdown ? breakdown?.payableToAstrologer || row.partnerPrice : row.partnerPrice)}
          </div>
        );
      },
      width: '130px',
      sortable: true,
    },
    // {
    //   name: 'Duration',
    //   selector: (row: AdminEarningRow) => row?.duration || 0,
    //   cell: (row: AdminEarningRow) => (
    //     <div className="text-gray-700">
    //       <span className="font-medium">{row?.duration || 0}</span> min
    //     </div>
    //   ),
    //   width: '120px',
    //   sortable: true,
    // },
    // {
    //   name: 'Payment Status',
    //   selector: (row: AdminEarningRow) => row.paymentStatus || 'unpaid',
    //   cell: (row: AdminEarningRow) => (
    //     <div className="flex items-center gap-1">
    //       {row.paymentStatus === 'paid' ? (
    //         <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium">
    //           Paid
    //         </span>
    //       ) : (
    //         <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-sm font-medium">
    //           Unpaid
    //         </span>
    //       )}
    //     </div>
    //   ),
    //   width: '150px',
    //   sortable: true,
    // },
  ], []);

  const hasActiveFilters = filters.type !== 'all' || filters.startDate || filters.endDate || searchText || filters.location !== 'all' || filters.paymentStatus !== 'all';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Earnings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredData.length} of {allAdminEarningData.length} records
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4 items-end">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Consultation">Consultation</option>
              <option value="puja">Puja</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="in-house">In-house</option>
              <option value="outside">Outside</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              From Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              To Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={handleSearch}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export Button */}
          <div>
            {filteredData.length > 0 && (
              <CSVLink
                data={prepareCSVData}
                filename={`Admin_Earnings_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                ({filteredData.length})
              </CSVLink>
            )}
          </div>

          {/* Clear Button */}
          <div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Gross Amount</p>
          <p className="text-lg font-bold text-gray-900">{IndianRupee(totals.total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">GST</p>
          <p className="text-lg font-bold text-orange-600">{IndianRupee(totals.gst)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Taxable Amount</p>
          <p className="text-lg font-bold text-gray-900">{IndianRupee(totals.net)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Admin Share</p>
          <p className="text-lg font-bold text-blue-600">{IndianRupee(totals.admin)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Astro Share</p>
          <p className="text-lg font-bold text-purple-600">{IndianRupee(totals.partner)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">TDS</p>
          <p className="text-lg font-bold text-red-600">{IndianRupee(totals.tds)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Records</p>
          <p className="text-lg font-bold text-gray-900">{filteredData.length}</p>
        </div>
      </div>

      {/* DataTable */}
      <MainDatatable
        data={filteredData}
        columns={columns.map((col) => ({
          ...col,
          minwidth: col.width,
          width: col.width,
        }))}
        title=""
        isLoading={isLoading}
        exportHeaders={false}
        fileName={`Admin_Earnings_${moment().format('YYYY-MM-DD_HH-mm-ss')}`}
        showSearch={false}
      />

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Legend:</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
              In-house
            </span>
            <span className="text-gray-600">(isLive: true)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium">
              Outside
            </span>
            <span className="text-gray-600">(isLive: false)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
              Paid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
              Unpaid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">TDS: 2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEarning;
