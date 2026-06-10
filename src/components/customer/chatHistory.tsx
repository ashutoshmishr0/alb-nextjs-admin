'use client';

import moment from "moment";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@mui/icons-material";
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

interface ChatHistoryItem {
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

interface ChatHistoryProps {
  customerId: string;
}

// Temporary Invoice Component
const TempInvoiceOne = ({ data, type }: { data: ChatHistoryItem; type: string }) => {
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

const ChatHistory: React.FC<ChatHistoryProps> = ({ customerId }) => {
  const router = useRouter();
  const [chatHistoryData, setChatHistoryData] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API Function to fetch chat history
  const fetchChatHistory = async () => {
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
          type: 'chat' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      
      if (data.success) {
        setChatHistoryData(data.chatHistory || []);
      } else {
        throw new Error(data.message || 'Failed to fetch chat history');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Data-Table Column
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: ChatHistoryItem) => chatHistoryData.indexOf(row) + 1, 
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: ChatHistoryItem) => row?.astrologerId?.astrologerName ? row?.astrologerId?.astrologerName : 'N/A' 
    },
    { 
      name: 'Customers', 
      selector: (row: ChatHistoryItem) => row?.customerId?.customerName ? row?.customerId?.customerName : 'N/A' 
    },
    { 
      name: 'Total Price', 
      selector: (row: ChatHistoryItem) => row?.totalPrice && IndianRupee(row?.totalPrice) 
    },
    { 
      name: 'Admin Share', 
      selector: (row: ChatHistoryItem) => row?.adminPrice && IndianRupee(row?.adminPrice) 
    },
    { 
      name: 'Astrologer Share', 
      selector: (row: ChatHistoryItem) => row?.partnerPrice && IndianRupee(row?.partnerPrice) 
    },
    { 
      name: 'Duration', 
      selector: (row: ChatHistoryItem) => row?.duration ? secondsToHMS(row?.duration) : 'N/A' 
    },
    { 
      name: 'Start Time', 
      selector: (row: ChatHistoryItem) => row?.startTime ? moment(Number(row?.startTime)).format('hh:mm:ss a') : 'N/A' 
    },
    { 
      name: 'End Time', 
      selector: (row: ChatHistoryItem) => row?.endTime ? moment(Number(row?.endTime)).format('hh:mm:ss a') : 'N/A' 
    },
    { 
      name: 'Date', 
      selector: (row: ChatHistoryItem) => row?.endTime ? moment(row?.createdAt).format('DD MMMM YYYY') : 'N/A', 
      width: "180px" 
    },
    {
      name: 'Message',
      cell: (row: ChatHistoryItem) => (
        <div className="flex gap-5 items-center">
          <Chat 
            className="cursor-pointer hover:text-blue-600 transition-colors" 
            onClick={() => {
              const astroName = row?.astrologerId?.astrologerName?.split(' ')[0].toLowerCase() || 'astrologer';
              const customerName = row?.customerId?.customerName?.split(' ')[0].toLowerCase() || 'customer';
              
              router.push(`/history/chat-history/chat-summary/${astroName}-${customerName}?astroId=${row?.astrologerId?._id}&customerId=${row?.customerId?._id}`);
            }} 
          />
        </div>
      ),
      centre: true, 
      width: "120px"
    },
    { 
      name: 'Invoice', 
      cell: (row: ChatHistoryItem) => <TempInvoiceOne data={row} type={'Chat'} /> 
    }
  ];

  useEffect(() => {
    if (customerId) {
      fetchChatHistory();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading chat history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={fetchChatHistory}
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
        data={chatHistoryData} 
        columns={columns} 
        title={'Chat History'}
        isLoading={loading}
      />
    </div>
  );
};

export default ChatHistory;