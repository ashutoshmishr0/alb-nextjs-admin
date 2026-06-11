'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import moment from 'moment';
import Image from 'next/image';
import Profile from '@/components/customer/profile';
import ChatHistory from '@/components/customer/chatHistory';
import CallHistory from '@/components/customer/callHistory';
import VideoCallHistory from '@/components/customer/VideoCallHistory';
import LiveHistory from '@/components/customer/LiveHistory';
import ReviewHistory from '@/components/customer/ReviewHistory';

// Types
interface Address {
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface Customer {
  _id: string;
  customerName: string;
  image?: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  address?: Address;
  alternateNumber?: string;
  wallet_balance: number;
  banned_status: boolean;
  call_status: boolean;
  chat_status: boolean;
  createdAt: string;
  device_id?: string;
  fcmToken?: string;
  first_wallet_recharged?: boolean;
  isBlock?: number;
  isDeleted?: number;
  isOnline?: boolean;
  isOtpVerified?: number;
  isSignupCompleted?: number;
  is_registered?: boolean;
  new_user?: boolean;
  otp?: number;
  status?: number;
  timeOfBirth?: string;
  updatedAt: string;
  type?: string;
  placeOfBirth?: string;
}

// Utility Functions
const IndianRupee = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

// API Function
const fetchCustomerById = async (customerId: string): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
  try {
    console.log('🔍 Fetching customer with ID:', customerId);
    
    const response = await fetch(`/api/admin/customer_details_by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        customerId: customerId 
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Full API response:', data);
    
    if (data.success && data.results) {
      return { success: true, customer: data.results };
    } else {
      return { success: false, error: data.message || 'Customer not found' };
    }
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

function ViewCustomerReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabHead = ['Profile', 'Chat', 'Call', 'Video Call', 'Live', 'Review'];

  useEffect(() => {
    console.log('🔄 Component mounted with customerId:', customerId);
    
    if (customerId) {
      loadCustomerData();
    } else {
      setLoading(false);
      setError('❌ Customer ID is missing from URL');
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Loading customer data for ID:', customerId);
      const result = await fetchCustomerById(customerId);
      
      console.log('📊 API result:', result);
      
      if (result.success && result.customer) {
        setCustomerData(result.customer);
        console.log('✅ Customer data set successfully:', result.customer);
      } else {
        const errorMsg = result.error || 'Customer not found in database';
        setError(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error('💥 Error loading customer data:', error);
      setError(`💥 Failed to load customer data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            Loading customer data...
          </div>
          <div className="text-gray-400 text-sm">Customer ID: {customerId}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-600 text-lg mb-4 font-semibold">{error}</div>
          <div className="text-gray-500 text-sm mb-4">
            Customer ID: <code className="bg-gray-100 px-2 py-1 rounded">{customerId || 'Not provided'}</code>
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => router.back()} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Go Back
            </button>
            <button 
              onClick={loadCustomerData} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 mb-4">No customer data available</div>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    customerName,
    image,
    email,
    phoneNumber,
    wallet_balance,
    dateOfBirth,
    timeOfBirth,
    address,
    gender,
    alternateNumber,
    placeOfBirth,
    isOnline,
    isOtpVerified,
    new_user,
    first_wallet_recharged,
    banned_status,
    createdAt
  } = customerData;
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  const formatAddress = () => {
    if (!address) return '';
    
    if (address.birthPlace) {
      return address.birthPlace;
    }
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : '';
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    
    try {
      if (dateTimeString.includes('T')) {
        return moment(dateTimeString).format('DD MMM YYYY, hh:mm A');
      } else {
        return moment(dateTimeString, 'YYYY-MM-DD').format('DD MMM YYYY');
      }
    } catch (error) {
      return dateTimeString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      // Handle various time formats
      if (timeString.includes('T')) {
        return moment(timeString).format('hh:mm A');
      } else if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        // Format: HH:mm or HH:mm:ss
        return moment(timeString, 'HH:mm:ss').format('hh:mm A');
      } else {
        return timeString;
      }
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="p-5">
      {/* Customer Info Card */}
      <div className="bg-white rounded-lg shadow-md mb-5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex-shrink-0">
              {image ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL2}${image}`}
                  alt={customerName}
                  className="w-full h-full rounded-full border-2 border-gray-300 object-cover"
                  onError={(e) => {
                    console.log('❌ Image failed to load');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                  {customerName?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg text-gray-800">{customerName}</div>
              <div className="text-gray-600">{phoneNumber}</div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="flex flex-col gap-4 md:border-l md:pl-6">
            <div className="font-bold text-lg text-gray-800">Contact Details</div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Email:</span> {email || ''}
            </div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Alternate Phone:</span> {alternateNumber || ''}
            </div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Location:</span> {formatAddress()}
            </div>
            {/* <div className="text-gray-800 font-medium">
              <span className="font-medium">Wallet:</span> {IndianRupee(wallet_balance)}
            </div> */}
          </div>

          {/* Details Section */}
          <div className="flex flex-col gap-4 md:border-l md:pl-6">
            <div className="font-bold text-lg text-gray-800">Details</div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Date of Birth:</span> {formatDateTime(dateOfBirth || '')}
            </div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Time of Birth:</span> {formatTime(timeOfBirth || '')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="py-5">
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <div className="flex border-b border-gray-200 min-w-max">
              {tabHead.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === index
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-5">
        {activeTab === 0 && (
          <div>
            <Profile customer={customerData} />
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <ChatHistory customerId={customerData._id} />
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <CallHistory customerId={customerData._id} />
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <VideoCallHistory customerId={customerData._id} />
          </div>
        )}
        
        {activeTab === 4 && (
          <div>
            <LiveHistory customerId={customerData._id} />
          </div>
        )}
        
        {activeTab === 5 && (
          <div>
            <ReviewHistory customerId={customerData._id} />
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Wrap with Suspense for loading fallback
const ViewCustomer = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            Loading customer information...
          </div>
        </div>
      }
    >
      <ViewCustomerReview />
    </Suspense>
  );
};

export default ViewCustomer;