'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import moment from "moment";
import Swal from "sweetalert2";

interface Review {
  customerName: string;
  astrologerName: string;
  rating: number;
  type: string;
  reviewText: string;
  createdAt: string;
  is_verified?: boolean;
  reviewId?: string;
}

interface ApiResponse<T> {
  reviews: Review[];
  success: boolean;
  data: T;
  message?: string;
}

const Review = () => {
  const router = useRouter();
  const [astrologersReviews, setAstrologersReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const getAstrologersReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/get-all-review`);
      const data: ApiResponse<Review[]> = await response.json();
      if (data.success) {
        setAstrologersReviews(data.reviews || []);
      } else {
        console.error('Failed to fetch reviews:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAstrologerReview = async (reviewId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this review!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/delete-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId }),
        });
        const data = await response.json();
        if (data.success) {
          Swal.fire('Deleted!', 'Review has been deleted successfully.', 'success');
          getAstrologersReviews();
        } else {
          Swal.fire('Error!', data.message || 'Failed to delete review.', 'error');
        }
      } catch (error) {
        Swal.fire('Error!', 'Something went wrong while deleting review.', 'error');
        console.error('Error deleting review:', error);
      }
    }
  };

  const toggleConsultationReviewStatus = async (reviewId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;

      const response = await fetch(`/api/admin/update-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          isReviewed: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAstrologersReviews(prev =>
          prev.map(r =>
            r.reviewId === reviewId ? { ...r, is_verified: newStatus } : r
          )
        );
      } else {
        Swal.fire('Error!', data.message || 'Failed to update status.', 'error');
      }
    } catch (error) {
      Swal.fire('Error!', 'Something went wrong.', 'error');
      console.error('Error toggling review status:', error);
    }
  };

  const openTextModal = (title: string, text: string) => {
    Swal.fire({
      title: title,
      html: `<div class="text-left max-h-96 overflow-y-auto">${text}</div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: '600px',
      customClass: {
        popup: 'rounded-lg',
        htmlContainer: 'text-left'
      }
    });
  };

  const columns = [
    {
      name: 'S.No.',
      selector: (row: Review, index?: number) => (index || 0) + 1,
      style: { paddingLeft: "20px" },
      width: "80px"
    },
    {
      name: 'Customer',
      selector: (row: Review) => row?.customerName || 'N/A'
    },
    {
      name: 'Astrologer',
      selector: (row: Review) => row?.astrologerName || 'N/A'
    },
    {
      name: 'Rating',
      selector: (row: Review) => (
        <div className="flex items-center">
          <span className="text-yellow-500">★</span>
          <span className="ml-1">{row.rating || 0}</span>
        </div>
      )
    },
    {
      name: 'Service',
      selector: (row: Review) => (
        <div className="capitalize">{row?.type?.toLowerCase() || 'N/A'}</div>
      )
    },
    {
      name: 'Comment',
      cell: (row: Review) => (
        <div
          onClick={() => openTextModal('Comment', row?.reviewText || '')}
          className="cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
        >
          {row?.reviewText
            ? row.reviewText.length > 50
              ? row.reviewText.substring(0, 50) + '...'
              : row.reviewText
            : 'N/A'}
        </div>
      )
    },
    {
      name: 'Date',
      selector: (row: Review) => moment(row.createdAt).format('DD/MM/YYYY')
    },
    {
      name: 'Action',
      cell: (row: Review) => (
        <div className="flex gap-3 items-center">
          <div
            onClick={() => router.push(`/review/add-review?edit=true&id=${row.reviewId}`)}
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <EditSvg />
          </div>

          <div
            onClick={() => deleteAstrologerReview(row.reviewId || '')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <DeleteSvg />
          </div>
          {/* Toggle - only for Consultation Review */}
          {row.type === 'Consultation Review' && (
            <div
              onClick={() => toggleConsultationReviewStatus(row.reviewId || '', !!row.is_verified)}
              title={row.is_verified ? 'Mark as unverified' : 'Mark as verified'}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
                rounded-full border-2 border-transparent transition-colors 
                duration-200 ease-in-out
                ${row.is_verified ? 'bg-green-500' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform 
                  rounded-full bg-white shadow transition duration-200 ease-in-out
                  ${row.is_verified ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </div>
          )}
        </div>
      ),
      width: "220px"
    },
  ];

  useEffect(() => {
    getAstrologersReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <MainDatatable
        data={astrologersReviews}
        columns={columns}
        title={'Review'}
        url={'/review/add-review'}
        isLoading={loading}
      />
    </div>
  );
};

export default Review;