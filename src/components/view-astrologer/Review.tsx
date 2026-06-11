// app/astrologer/view-astrologer/components/review.tsx
import React, { useEffect, useState } from "react";
import MainDatatable from "@/components/common/MainDatatable";
import { TableColumn } from "react-data-table-component";
import { base_url, get_review_by_astrologer_id } from "@/lib/api-routes";
import ViewModal from "./ViewModal";

// Updated interface to match actual API response
interface ReviewData {
  reviewText: string | undefined;
  _id?: string;
  type: string;
  customerName: string;
  customerImage?: string;
  astrologerName: string;
  astrologerImage?: string;
  rating?: number; // Note: API uses 'rating' not 'ratings'
  ratings?: number; // Keep both for backward compatibility
  comments?: string;
  comment?: string; // API might use 'comment' instead of 'comments'
  is_verified?: boolean;
  createdAt?: string;
}

interface ReviewProps {
  astrologerId: string;
}

const Review: React.FC<ReviewProps> = ({ astrologerId }) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");

  const openModal = (comment: string) => {
    setSelectedComment(comment);
    setModalIsOpen(true);
  };

  const closeModal = () => setModalIsOpen(false);

  const columns = [
    { 
      name: 'S.No.', 
      cell: (row: any, rowIndex?: number) => <div>{(rowIndex || 0) + 1}</div>,
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: ReviewData) => row?.astrologerName || '',
      sortable: true 
    },
    { 
      name: 'Customer', 
      selector: (row: ReviewData) => row?.customerName || '',
      sortable: true 
    },
    { 
      name: 'Type', 
      selector: (row: ReviewData) => row?.type || '',
      sortable: true 
    },
    { 
      name: 'Rating', 
      selector: (row: ReviewData) => {
        // Handle both 'rating' and 'ratings' fields
        const ratingValue = row?.rating ?? row?.ratings;
        return ratingValue !== undefined && ratingValue !== null 
          ? ratingValue.toString() 
          : '';
      },
      sortable: true,
      width: '100px'
    },
   
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      if (!astrologerId) {
        console.warn('No astrologerId provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Fetching reviews for astrologer:', astrologerId);
        
        const response = await fetch(`/${get_review_by_astrologer_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data);
          
          // Handle different possible response structures
          const reviewsData = data.reviews || data.data || [];
          
          if (Array.isArray(reviewsData)) {
            setReviews(reviewsData);
            console.log('Reviews loaded:', reviewsData.length);
          } else {
            console.error('Invalid reviews data structure:', reviewsData);
            setReviews([]);
          }
        } else {
          console.error('Failed to fetch reviews:', response.status);
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [astrologerId]);

  return (
    <>
      <MainDatatable 
        data={reviews} 
        columns={columns} 
        url="/astrologer/view-astrologer"
        title="Review"
        addButtonActive={false}
        isLoading={isLoading}
      />

      <ViewModal
        open={modalIsOpen} 
        text={selectedComment} 
        title={'Rating Comment'} 
        onClose={closeModal} 
      />
    </>
  );
};

export default Review;