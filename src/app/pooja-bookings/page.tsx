'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, User, CreditCard, Loader2, CheckCircle, Clock, XCircle, AlertCircle, MapPin } from 'lucide-react';
import MainDatatable from '@/components/LogsDataTable';

// Types
interface PujaBooking {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  pujaDetails: {
    pujaId: {
      _id: string;
      title: string;
      imageUrl?: string;
      mainImage?: string;
      pricingPackages: Array<{
        _id: string;
        title: string;
        price: number;
      }>;
      category?: string;
    };
    packageId: string;
    selectedDate: string;
    price: number;
    assignedAstro?: {
      _id: string;
      astrologerName: string;
      email: string;
      phone: string;
      specialization: string;
    };
    notes?: string;
    videos?: string[];
    bookingDate: string;
    status: string;
  };
  sankalpPerson: {
    fullName: string;
    email: string;
    whatsappNumber: string;
    pujaReason: string;
    gotra: string;
    dateOfBirth: string;
    timeOfBirth: string;
    sankalpPlace: string;
    sankalpLongitude?: string;
    sankalpLatitude?: string;
    gender: string;
  };
  deliveryAddress: {
    fullAddress: string;
    nearestLandmark: string;
    pinCode: string;
    country: string;
  };
  termsAccepted: boolean;
  confirmationNumber: string;
  paymentStatus: string;
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayCurrency?: string;
    razorpayAmount?: number;
    razorpayPaymentMode?: string;
    email?: string;
    contact?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const PujaBookingsPage = () => {
  const [allData, setAllData] = useState<PujaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(() => getTodayDate());
  const [endDate, setEndDate] = useState(() => getTodayDate());

  const getPaymentStatusDisplay = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'successful':
        return {
          label: 'Paid',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'pending':
        return {
          label: 'Pending Payment',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'failed':
        return {
          label: 'Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: <XCircle className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: paymentStatus,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.set('startDate', startDate);
        
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate());
        const endDatePlusOne = endDateObj.toISOString().split('T')[0];
        params.set('endDate', endDatePlusOne);
        
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/get_all_puja_bookings?${params.toString()}`;
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
    if (newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };

  const filteredBookings = useMemo(() => {
    return allData.filter(booking => {
      const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
      return matchesPayment;
    });
  }, [paymentFilter, allData]);

  const paymentCounts = useMemo(() => {
    const counts = {
      all: allData.length,
      successful: 0,
      pending: 0,
      failed: 0
    };
    
    allData.forEach(booking => {
      const status = booking.paymentStatus;
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [allData]);

  const paymentFilters = [
    { label: 'All Bookings', value: 'all', count: paymentCounts.all },
    { label: 'Paid', value: 'successful', count: paymentCounts.successful },
    { label: 'Pending Payment', value: 'pending', count: paymentCounts.pending },
    { label: 'Failed Payment', value: 'failed', count: paymentCounts.failed }
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getPackageName = (pujaId: any, packageId: string) => {
    if (!pujaId || !pujaId.pricingPackages) return 'Standard Package';
    const pkg = pujaId.pricingPackages.find((p: any) => p._id.toString() === packageId.toString());
    return pkg ? pkg.title : 'Standard Package';
  };

  const columns = useMemo(() => [
    {
      name: 'Customer',
      selector: (row: PujaBooking) => row.sankalpPerson.fullName,
      cell: (row: PujaBooking) => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{row.sankalpPerson.fullName}</div>
            <div className="text-xs text-gray-500">{row.sankalpPerson.whatsappNumber}</div>
          </div>
        </div>
      ),
      sortable: true,
      width: '250px',
    },
    {
      name: 'Puja Details',
      selector: (row: PujaBooking) => row.pujaDetails.pujaId?.title || 'N/A',
      cell: (row: PujaBooking) => (
        <div className="py-2">
          <div className="font-medium text-gray-900 text-sm">{row.pujaDetails.pujaId?.title || 'N/A'}</div>
          <div className="text-xs text-gray-500">{getPackageName(row.pujaDetails.pujaId, row.pujaDetails.packageId)}</div>
        </div>
      ),
      sortable: true,
      width: '220px',
    },
    {
      name: 'Puja Date',
      selector: (row: PujaBooking) => row.pujaDetails.selectedDate,
      cell: (row: PujaBooking) => (
        <div className="text-sm text-gray-900">
          {formatDate(row.pujaDetails.selectedDate)}
        </div>
      ),
      sortable: true,
      width: '140px',
    },
    {
      name: 'Payment Status',
      selector: (row: PujaBooking) => row.paymentStatus,
      cell: (row: PujaBooking) => {
        const paymentDisplay = getPaymentStatusDisplay(row.paymentStatus);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${paymentDisplay.bgColor} ${paymentDisplay.textColor}`}>
            {paymentDisplay.icon}
            {paymentDisplay.label}
          </span>
        );
      },
      sortable: true,
      width: '180px',
    },
    {
      name: 'Price',
      selector: (row: PujaBooking) => row.pujaDetails.price,
      cell: (row: PujaBooking) => (
        <div className="text-sm font-semibold text-gray-900">
          {formatPrice(row.pujaDetails.price)}
        </div>
      ),
      sortable: true,
      width: '130px',
    },
    {
      name: 'Booking Date',
      selector: (row: PujaBooking) => row.createdAt,
      cell: (row: PujaBooking) => (
        <div>
          <div className="text-sm text-gray-900">{formatTime(row.createdAt)}</div>
          <div className="text-xs text-gray-500">{formatDate(row.createdAt)}</div>
        </div>
      ),
      sortable: true,
      width: '150px',
    },
  ], []);

  const ExpandedComponent = ({ data }: { data: PujaBooking }) => {
    const paymentDisplay = getPaymentStatusDisplay(data.paymentStatus);
    
    return (
      <div className="px-6 py-6 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Sankalp Person Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                Sankalp Person Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">{data.sankalpPerson.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900 truncate ml-4">{data.sankalpPerson.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">WhatsApp</span>
                  <span className="text-sm font-medium text-gray-900">{data.sankalpPerson.whatsappNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gender</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{data.sankalpPerson.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">DOB</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(data.sankalpPerson.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">TOB</span>
                  <span className="text-sm font-medium text-gray-900">{data.sankalpPerson.timeOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gotra</span>
                  <span className="text-sm font-medium text-gray-900">{data.sankalpPerson.gotra}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Place</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{data.sankalpPerson.sankalpPlace}</span>
                </div>
                {data.sankalpPerson.sankalpLatitude && data.sankalpPerson.sankalpLongitude && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Coordinates</span>
                    <span className="text-xs font-medium text-gray-900 text-right ml-4">
                      {data.sankalpPerson.sankalpLatitude}, {data.sankalpPerson.sankalpLongitude}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-600 block mb-1">Puja Reason:</span>
                  <span className="text-sm font-medium text-gray-900">{data.sankalpPerson.pujaReason}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Delivery Address
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Full Address</span>
                  <span className="text-sm font-medium text-gray-900">{data.deliveryAddress.fullAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Landmark</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{data.deliveryAddress.nearestLandmark}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pin Code</span>
                  <span className="text-sm font-medium text-gray-900">{data.deliveryAddress.pinCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Country</span>
                  <span className="text-sm font-medium text-gray-900">{data.deliveryAddress.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Puja & Payment Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                Puja Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Puja Name</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{data.pujaDetails.pujaId?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Package</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{getPackageName(data.pujaDetails.pujaId, data.pujaDetails.packageId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(data.pujaDetails.selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(data.pujaDetails.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confirmation #</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">{data.confirmationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Booking Date</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(data.createdAt)}</span>
                </div>
                {data.pujaDetails.assignedAstro && (
                  <>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-600 block mb-2">Assigned Astrologer:</span>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name</span>
                          <span className="text-sm font-medium text-gray-900">{data.pujaDetails.assignedAstro.astrologerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone</span>
                          <span className="text-sm font-medium text-gray-900">{data.pujaDetails.assignedAstro.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email</span>
                          <span className="text-sm font-medium text-gray-900 truncate ml-4">{data.pujaDetails.assignedAstro.email}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Details - Show for all bookings */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-red-600" />
                Payment Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${paymentDisplay.bgColor} ${paymentDisplay.textColor}`}>
                    {paymentDisplay.icon}
                    {paymentDisplay.label}
                  </span>
                </div>
                {data.paymentDetails.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order ID</span>
                    <span className="text-xs font-medium text-gray-900 font-mono">{data.paymentDetails.razorpayOrderId}</span>
                  </div>
                )}
                {data.paymentStatus === 'successful' && (
                  <>
                    {data.paymentDetails.razorpayPaymentId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment ID</span>
                        <span className="text-xs font-medium text-gray-900 font-mono">{data.paymentDetails.razorpayPaymentId}</span>
                      </div>
                    )}
                    {data.paymentDetails.razorpayAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount Paid</span>
                        <span className="text-sm font-semibold text-green-700">{formatPrice(data.paymentDetails.razorpayAmount / 100)}</span>
                      </div>
                    )}
                    {data.paymentDetails.razorpayPaymentMode && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{data.paymentDetails.razorpayPaymentMode}</span>
                      </div>
                    )}
                  </>
                )}
                {data.paymentStatus === 'pending' && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-yellow-600">Payment is pending. Customer needs to complete the payment.</p>
                  </div>
                )}
                {data.paymentStatus === 'failed' && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-red-600">Payment failed. Customer may retry the payment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                Customer Account
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer ID</span>
                  <span className="text-xs font-medium text-gray-900 font-mono">{data.customerId?._id}</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  const dateFiltersComponent = (
    <>
      <input
        type="date"
        value={startDate}
        max={getTodayDate()}
        onChange={(e) => handleStartDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
      <span className="text-gray-500 text-sm">to</span>
      <input
        type="date"
        value={endDate}
        max={getTodayDate()}
        min={startDate}
        onChange={(e) => handleEndDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading puja bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto">
        <MainDatatable
          data={filteredBookings}
          columns={columns.map((col) => ({
            ...col,
            minwidth: col.width,
            width: undefined,
          }))}
          title="Puja Bookings"
          isLoading={loading}
          showSearch={true}
          expandableRows={true}
          expandableRowsComponent={ExpandedComponent}
          statusFilters={paymentFilters}
          onStatusFilterChange={setPaymentFilter}
          selectedStatus={paymentFilter}
          dateFilters={dateFiltersComponent}
          addButtonActive={false}
          showDownloadButton={false}
        />
      </div>
    </div>
  );
};

export default PujaBookingsPage;