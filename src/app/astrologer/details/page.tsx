'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import moment from 'moment';
import { PhoneCall, Video } from 'lucide-react';

import TopHeaderSection from '@/components/common/TopHeaderSection';
import AstrologerProfile from '@/components/AstrologerProfile';
import BookingSection from '@/components/BookingSection';
import ReviewsSection from '@/components/ReviewsSection';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { toaster } from '../../../utils/services/toast-service';
import { Review, User } from './types';
import SlotBookingSection from '@/components/BookingSection';
// import { trackConsultationEvent } from '@/utils/consultationTracking';

const SingleAstrologer: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const astrologerId = searchParams?.get('id');
  const bookingSectionRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [loadingAstrologer, setLoadingAstrologer] = useState<boolean>(true);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Data states
  const [astrologerData, setAstrologerData] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Error states
  const [astrologerError, setAstrologerError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // UI states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  // ✅ Helper function to get available buttons with safety checks
  const getAvailableButtons = () => {
    if (!astrologerData) return [];

    const buttons = [];

    // Check video_call_status
    const videoStatus = astrologerData.video_call_status;
    if (videoStatus && videoStatus !== 'offline') {
      buttons.push({
        type: 'video',
        icon: <Video size={24} />,
        label: 'Video Call',
        color: 'bg-[#980d0d]'
      });
    }

    // Check call_status
    const callStatus = astrologerData.call_status;
    if (callStatus && callStatus !== 'offline') {
      buttons.push({
        type: 'call',
        icon: <PhoneCall size={24} />,
        label: 'Phone Call',
        color: 'bg-[#980d0d]'
      });
    }

    return buttons;
  };

  // API Functions
  const fetchAstrologerDetails = async (id: string) => {
    try {
      setLoadingAstrologer(true);
      setAstrologerError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get-astrologer-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          astrologerId: id
        })
      });

      const data = await response.json();
    
      if (response.ok && data.success && data.astrologer) {
        console.log('Astrologer status:', {
          video: data.astrologer.video_call_status,
          call: data.astrologer.call_status,
          chat: data.astrologer.chat_status
        });
    //      trackConsultationEvent("add_to_cart", {
    //   consultationName: '',
    //   consultationId: '',
    //   price: 0,
    //   consultantName: data.astrologer.astrologerName,
    // });
        setAstrologerData(data.astrologer);
      } else {
        setAstrologerError(data.message || 'Failed to fetch astrologer details');
        console.warn('Astrologer details API failed:', data.message);
      }
    } catch (err) {
      console.error('Error fetching astrologer details:', err);
      setAstrologerError('Network error while fetching astrologer details');
    } finally {
      setLoadingAstrologer(false);
    }
  };

  const fetchAstrologerReviews = async (id: string) => {
    try {
      setLoadingReviews(true);
      setReviewsError(null);

      const response = await fetch(`/api/admin/get-astrologer-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          astrologerId: id
        })
      });
      
      const data = await response.json();

      if (response.ok && data.reviews) {
        setReviews(data.reviews);
      } else {
        setReviewsError(data.message || 'Failed to fetch reviews');
        console.warn('Reviews API failed:', data.message);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviewsError('Network error while fetching reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  // User Management
  const loadUserFromStorage = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData && userData._id) {
          setCurrentUser(userData);
          return userData;
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    return null;
  };

  const saveUserToStorage = (user: User) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  // Scroll to booking section with offset adjustment
  const scrollToBooking = () => {
    if (bookingSectionRef.current) {
      const elementPosition = bookingSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Hide floating button when booking section is visible
  useEffect(() => {
    const handleScroll = () => {
      if (bookingSectionRef.current) {
        const rect = bookingSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        setShowFloatingButton(!isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Event Handlers
  const handleOpenLoginModal = (): void => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData: User) => {
    saveUserToStorage(userData);
    setShowLoginModal(false);
    toaster.success({ text: 'Login successful!' });
  };

  // Effects
  useEffect(() => {
    if (!astrologerId) {
      router.back();
      return;
    }

    loadUserFromStorage();

    const fetchAllData = async () => {
      await Promise.allSettled([
        fetchAstrologerDetails(astrologerId),
        fetchAstrologerReviews(astrologerId)
      ]);
    };

    fetchAllData();
  }, [astrologerId, router]);

  // ✅ Calculate available buttons
  const availableButtons = getAvailableButtons();

  // Determine what we can render
  const canRenderAstrologerInfo = astrologerData && !astrologerError;
  const canRenderReviews = reviews.length > 0 || !reviewsError;
  const isCompletelyLoading = loadingAstrologer && loadingReviews;

  // Loading skeleton
  if (isCompletelyLoading) {
    return (
      <>
        <TopHeaderSection />
        <LoadingSkeleton />
      </>
    );
  }

  return (
    <>
      {/* <TopHeaderSection /> */}
      <div className="p-5 lg:grid grid-cols-9 gap-5 max-lg:space-y-5 select-none">

        {/* Astrologer Profile Section */}
        {/* {canRenderAstrologerInfo && (
          <div className="lg:col-span-5">
            <AstrologerProfile astrologerData={astrologerData} />
          </div>
        )} */}

        {/* Booking Section */}
        {canRenderAstrologerInfo && astrologerId && (
          <div ref={bookingSectionRef} className="lg:col-span-6">
            {/* <BookingSection
              astrologerId={astrologerId}
              astrologerData={astrologerData}
              currentUser={currentUser}
              onLoginRequired={handleOpenLoginModal}
              consultationPrices={astrologerData?.consultationPrices || []}
            /> */}
         
<SlotBookingSection
  astrologerId={astrologerId}
  astrologerData={astrologerData}
  currentUser={currentUser}
  onLoginRequired={handleOpenLoginModal}
  consultationPrices={astrologerData?.consultationPrices || []}
/>
          </div>
        )}

        {/* Reviews Section */}
        {/* <div className="col-span-9">
          <ReviewsSection
            reviews={reviews}
            loadingReviews={loadingReviews}
            reviewsError={reviewsError}
            astrologerId={astrologerId}
            onRetryReviews={() => astrologerId && fetchAstrologerReviews(astrologerId)}
          />
        </div> */}
      </div>

      {showFloatingButton && canRenderAstrologerInfo && availableButtons.length > 0 && (
        <div className="md:hidden fixed right-4 bottom-0 -translate-y-1/4 flex flex-col gap-3 z-50">
          {availableButtons.map((button) => (
            <button
              key={button.type}
              onClick={scrollToBooking}
              className={`${button.color} text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95`}
              aria-label={button.label}
            >
              {button.icon}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default SingleAstrologer;
