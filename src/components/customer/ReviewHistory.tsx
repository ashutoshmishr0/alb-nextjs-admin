'use client';

import React, { useEffect, useState } from "react";
import ViewModal from "../modals/viewmodal";
import MainDatatable from "../common/MainDatatable";

// Types
interface Customer {
  _id: string;
  customerName: string;
}

interface Astrologer {
  _id: string;
  astrologerName: string;
}

interface ReviewHistoryItem {
  _id: string;
  customer: Customer;
  astrologer: Astrologer;
  ratings: number;
  comments?: string;
  is_verified: boolean;
}

interface ReviewHistoryProps {
  customerId: string;
}

const ReviewHistory: React.FC<ReviewHistoryProps> = ({ customerId }) => {
  const [reviewHistoryData, setReviewHistoryData] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [text, setText] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = (text: string) => {
    setModalIsOpen(true);
    setText(text);
  };

  const closeModal = () => setModalIsOpen(false);

  // API Function to fetch review history
  const fetchReviewHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/get-customer-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customerId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch review history');
      }

      const data = await response.json();
      
      if (data.success) {
        setReviewHistoryData(data.reviewHistory || data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch review history');
      }
    } catch (error) {
      console.error('Error fetching review history:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // DataTable Columns
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: ReviewHistoryItem) => reviewHistoryData.indexOf(row) + 1, 
      width: '80px' 
    },
    { 
      name: 'Customer', 
      selector: (row: ReviewHistoryItem) => row?.customer?.customerName || 'N/A' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: ReviewHistoryItem) => row?.astrologer?.astrologerName || 'N/A' 
    },
    { 
      name: 'Rating', 
      selector: (row: ReviewHistoryItem) => row.ratings 
    },
    { 
      name: 'Comment', 
      selector: (row: ReviewHistoryItem) => row?.comments ? (
        <div 
          className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors" 
          onClick={() => openModal(row.comments || '')} // Fixed: Added fallback empty string
        >
          {row.comments.length > 50 ? `${row.comments.substring(0, 50)}...` : row.comments}
        </div>
      ) : 'N/A' 
    },
    { 
      name: "Status", 
      cell: (row: ReviewHistoryItem) => (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          row.is_verified 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.is_verified ? "Verified" : "Unverified"}
        </div>
      ) 
    },
  ];

  useEffect(() => {
    if (customerId) {
      fetchReviewHistory();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading review history...</div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center py-8">
  //       <div className="text-center">
  //         <div className="text-red-600 mb-4">Error: {error}</div>
  //         <button 
  //           onClick={fetchReviewHistory}
  //           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
  //         >
  //           Try Again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <MainDatatable
          data={reviewHistoryData} 
          columns={columns} 
          title={'Review History'}
          isLoading={loading}
        />
      </div>

      <ViewModal
        openModal={modalIsOpen} 
        text={text} 
        title={'Rating Comment'} 
        handleCloseModal={closeModal} 
      />
    </>
  );
}

export default ReviewHistory;