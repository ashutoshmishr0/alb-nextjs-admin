'use client';

import moment from "moment";
import React, { useEffect, useState } from "react";
import MainDatatable from "../common/MainDatatable";
import { IndianRupee, secondsToHMS } from "@/utils/common-function";


// Types
interface Astrologer {
  _id: string;
  astrologerName: string;
}

interface Customer {
  _id: string;
  customerName: string;
}

interface VideoCallHistoryItem {
  _id: string;
  astrologerId: Astrologer;
  customerId: Customer;
  totalPrice: number;
  adminPrice: number;
  partnerPrice: number;
  duration: number;
  startTime: number;
  endTime: number;
  createdAt: string;
}

interface VideoCallHistoryProps {
  customerId: string;
}

// Temporary Invoice Component
const TempInvoiceOne = ({ data, type }: { data: VideoCallHistoryItem; type: string }) => {
  const handleDownload = () => {
    console.log('Download invoice for:', data._id, 'Type:', type);
    // Add your invoice download logic here
    alert(`Download ${type} invoice for ${data._id}`);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
    >
      Download
    </button>
  );
};

const VideoCallHistory: React.FC<VideoCallHistoryProps> = ({ customerId }) => {
  const [videoCallHistoryData, setVideoCallHistoryData] = useState<VideoCallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API Function to fetch video call history
  const fetchVideoCallHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/customer_chat_history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customerId, 
          type: 'VideoCall' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video call history');
      }

      const data = await response.json();
      
      if (data.success) {
        setVideoCallHistoryData(data.videoCallHistory || data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch video call history');
      }
    } catch (error) {
      console.error('Error fetching video call history:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Data-Table Column
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: VideoCallHistoryItem) => videoCallHistoryData.indexOf(row) + 1, 
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: VideoCallHistoryItem) => row?.astrologerId?.astrologerName ? row?.astrologerId?.astrologerName : 'N/A' 
    },
    { 
      name: 'Customers', 
      selector: (row: VideoCallHistoryItem) => row?.customerId?.customerName ? row?.customerId?.customerName : 'N/A' 
    },
    { 
      name: 'Total Price', 
      selector: (row: VideoCallHistoryItem) => row?.totalPrice && IndianRupee(row?.totalPrice) 
    },
    { 
      name: 'Admin Share', 
      selector: (row: VideoCallHistoryItem) => row?.adminPrice && IndianRupee(row?.adminPrice) 
    },
    { 
      name: 'Astrologer Share', 
      selector: (row: VideoCallHistoryItem) => row?.partnerPrice && IndianRupee(row?.partnerPrice) 
    },
    { 
      name: 'Duration', 
      selector: (row: VideoCallHistoryItem) => row?.duration ? secondsToHMS(row?.duration) : 'N/A' 
    },
    { 
      name: 'Start Time', 
      selector: (row: VideoCallHistoryItem) => row?.startTime ? moment(row?.startTime).format('hh:mm:ss a') : 'N/A' 
    },
    { 
      name: 'End Time', 
      selector: (row: VideoCallHistoryItem) => row?.endTime ? moment(Number(row?.endTime)).format('hh:mm:ss a') : 'N/A' 
    },
    { 
      name: 'Date', 
      selector: (row: VideoCallHistoryItem) => row?.endTime ? moment(row?.createdAt).format('DD MMMM YYYY') : 'N/A', 
      width: "180px" 
    },
    { 
      name: 'Invoice', 
      cell: (row: VideoCallHistoryItem) => <TempInvoiceOne data={row} type={'Video Call'} /> 
    }
  ];

  useEffect(() => {
    if (customerId) {
      fetchVideoCallHistory();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading video call history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={fetchVideoCallHistory}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <MainDatatable
        data={videoCallHistoryData} 
        columns={columns} 
        title={'Video Call History'}
        isLoading={loading}
      />
    </div>
  );
};

export default VideoCallHistory;