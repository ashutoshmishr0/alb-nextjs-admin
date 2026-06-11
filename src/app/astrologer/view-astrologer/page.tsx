// app/astrologer/view-astrologer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { base_url, get_astrologer_by_id, get_astrologer_duration_by_id , img_url } from '@/lib/api-routes';
import { IndianRupee } from '@/utils/common-function';
import Profile from '@/components/view-astrologer/Profile';
import ChatHistory from '@/components/view-astrologer/Chat-history';
import CallHistory from '@/components/view-astrologer/CallHistory';
import VideoCallHistory from '@/components/view-astrologer/VedioCallHistory';
import LiveHistory from '@/components/view-astrologer/LiveHistory';
import GiftHistory from '@/components/view-astrologer/GiftHistory';
import Review from '@/components/view-astrologer/Review';

// Types
interface Astrologer {
  _id: string;
  astrologerName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  wallet_balance: number;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  dateOfBirth: string;
  chat_price: number;
  call_price: number;
  video_call_price: number;
  experience: number;
  about: string;
  short_bio: string;
  long_bio: string;
  rating: number;
  skill: Array<{ skill: string }>;
  remedies: Array<{ title: string; description: string }>;
  mainExpertise: Array<{ mainExpertise: string }>;
  account_holder_name: string;
  account_number: string;
  account_type: string;
  account_name: string;
  IFSC_code: string;
  panCard: string;
  aadharNumber: string;
  chat_status: string;
  call_status: string;
  video_call_status: string;
  alternateNumber: string;
  gender: string;
  currency: string;
  free_min: number;
  avg_rating: number;
  youtubeLink: string;
  follower_count: number;
  address: string;
  country_phone_code: string;
  commission_video_call_price: number;
  normal_video_call_price: number;
  commission_normal_video_call_price: number;
  consultation_price: number;
  commission_call_price: number;
  commission_chat_price: number;
  commission_remark: string;
  expertise: string;
  live_notification: boolean;
  chat_notification: boolean;
  call_notification: boolean;
  workingOnOtherApps: boolean;
  activeBankAcount: boolean;
  isVerified: boolean;
  isOnline: boolean;
  today_earnings: number;
}

interface DurationData {
  totalActiveDuration: number;
  totalOfflineDuration: number;
}

export default function ViewAstrologer() {
  const router = useRouter();
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [durationData, setDurationData] = useState<DurationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [astrologerId, setAstrologerId] = useState<string>('');

  const tabHead = ['Profile', 'Chat', 'Call', 'Video Call', 'Live', 'Gift', 'Review'];
  const [activeTabHead, setActiveTabHead] = useState(0);

  // Get astrologer data from sessionStorage or localStorage
  useEffect(() => {
    const getAstrologerData = () => {
      // Try to get from sessionStorage first (common pattern for state passing in Next.js)
      const stateData = sessionStorage.getItem('selectedAstrologer');
      
      if (stateData) {
        try {
          const parsedData = JSON.parse(stateData);
          setAstrologerId(parsedData._id);
          setAstrologer(parsedData); // Set initial data from state
        } catch (error) {
          console.error('Error parsing astrologer data:', error);
        }
      } else {
        // If no state data, redirect back
        router.back();
      }
    };

    getAstrologerData();
  }, [router]);

  // Fetch detailed astrologer data and duration
  useEffect(() => {
    const fetchAstrologerDetails = async () => {
      if (!astrologerId) return;

      try {
        setIsLoading(true);
        
        // Fetch detailed astrologer data
        const astroResponse = await fetch(`/${get_astrologer_by_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId
          })
        });

        if (astroResponse.ok) {
          const astroData = await astroResponse.json();
          setAstrologer(astroData.results || astroData);
        }

        // Fetch duration data
        const durationResponse = await fetch(`/${get_astrologer_duration_by_id(astrologerId)}`);
        if (durationResponse.ok) {
          const durationData = await durationResponse.json();
          setDurationData(durationData);
        }
      } catch (error) {
        console.error('Error fetching astrologer details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (astrologerId) {
      fetchAstrologerDetails();
    }
  }, [astrologerId]);

  const timeFormat = (seconds: number) => {
    const duration = moment.duration(seconds, 'seconds');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const secs = duration.seconds();

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!astrologer) {
    return <div className="p-5 text-center">Astrologer not found</div>;
  }

  const {
    astrologerName,
    profileImage,
    email,
    phoneNumber,
    wallet_balance,
    city,
    state,
    country,
    zipCode,
    dateOfBirth,
  } = astrologer;

  return (
    <>
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="mb-5 flex items-center gap-2 text-gray-700 hover:text-gray-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Astrologer Info Card */}
      <div className="p-5 bg-white mb-5 shadow-md rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-5">
          {/* Profile Section */}
          <div className="flex items-center gap-5">
            <img
              src={img_url + profileImage}
              alt={astrologerName}
              className="w-24 h-24 rounded-full border border-gray-300 object-cover"
            />
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">{astrologerName}</div>
              <div className="text-gray-600">{phoneNumber}</div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-4 border-l border-gray-300 pl-5">
            <div className="font-bold text-lg">Contact Details</div>
            <div className="text-gray-700">{email}</div>
            <div className="text-gray-700">
              {city}, {state}, {country} - {zipCode}
            </div>
            <div className="text-gray-700">Wallet: {IndianRupee(wallet_balance)}</div>
          </div>

          {/* Additional Details */}
          <div className="flex flex-col gap-4 border-l border-gray-300 pl-5">
            <div className="font-bold text-lg">Details</div>
            <div className="text-gray-700">
              Birth Date: {moment(dateOfBirth).format('DD MMM YYYY')}
            </div>
            <div className="text-gray-700">
              Active Duration: {
                durationData && durationData.totalActiveDuration > 0
                  ? timeFormat(durationData.totalActiveDuration / 1000)
                  : '00:00:00'
              }
            </div>
            <div className="text-gray-700">
              Offline Duration: {
                durationData && durationData.totalOfflineDuration > 0
                  ? timeFormat(durationData.totalOfflineDuration / 1000)
                  : '00:00:00'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center py-5">
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabHead.map((value, index) => (
              <button
                key={index}
                onClick={() => setActiveTabHead(index)}
                className={`px-6 py-3 whitespace-nowrap font-medium transition-colors ${
                  activeTabHead === index
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-5">
        {activeTabHead === 0 && (
          <div>
            <Profile astrologer={astrologer} />
          </div>
        )}
        {activeTabHead === 1 && (
          <div>
            <ChatHistory astrologerId={astrologerId} />
          </div>
        )}
        {activeTabHead === 2 && (
          <div>
            <CallHistory astrologerId={astrologerId} />
          </div>
        )}
        {activeTabHead === 3 && (
          <div>
            <VideoCallHistory astrologerId={astrologerId} />
          </div>
        )}
        {activeTabHead === 4 && (
          <div>
            <LiveHistory astrologerId={astrologerId} />
          </div>
        )}
        {activeTabHead === 5 && (
          <div>
            <GiftHistory astrologerId={astrologerId} />
          </div>
        )}
        {activeTabHead === 6 && (
          <div>
            <Review astrologerId={astrologerId} />
          </div>
        )}
      </div>
    </>
  );
}