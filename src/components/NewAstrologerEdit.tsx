// app/astrologer/edit/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { base_url, get_astrologer_by_id } from '@/lib/api-routes';
import PersonalInfo from '@/components/astrologer/PersonalInfo';
import ProfessionalInfo from '@/components/astrologer/ProfessionalInfo';
import BankDetails from '@/components/astrologer/BankDetails';
import MediaGallery from '@/components/astrologer/MediaGallery';
import SkillsExpertise from '@/components/astrologer/SkillsExpertise';
import Consultations from '@/components/astrologer/Consultations';
import ReportsAndAvailability from '@/components/astrologer/AstrologerUnavailibilty';
import FirstTimeOfferManagement from './astrologer/FirstTimeOfferManagement';
import { Mail, Phone, Briefcase } from 'lucide-react';

export default function EditAstrologer() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const astrologerId = searchParams.get('id');

  const [astrologer, setAstrologer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    'Personal Info',
    'Professional Info',
    'Bank & KYC Details',
    'Media & Gallery',
    'Skills & Expertise',
    'Consultations',
    'First Time Customer Offer',
    'Reports & Unavailability'
  ];

  useEffect(() => {
    fetchAstrologer();
  }, [astrologerId]);

  const fetchAstrologer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/${get_astrologer_by_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ astrologerId })
      });

      const data = await response.json();
      if (data.success) {
        setAstrologer(data.results);
      }
    } catch (error) {
      console.error('Error fetching astrologer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-500"></div>
      </div>
    );
  }

  if (!astrologer) {
    return <div className="p-8 text-center">Astrologer not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <img
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${astrologer.profileImage}`}
                alt={astrologer.astrologerName}
                className="w-12 h-12 rounded-full border-2 border-red-500 object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{astrologer.astrologerName}</h1>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {astrologer.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {astrologer.phoneNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {astrologer.experience} years exp.
                  </span>
                </div>
              </div>
            </div>
            
            {/* <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                astrologer.isOnline 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {astrologer.isOnline ? 'Online' : 'Offline'}
              </span>
            </div> */}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto -mb-px">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-3 whitespace-nowrap font-medium text-sm transition-colors border-b-2 ${
                  activeTab === index
                    ? 'text-red-600 border-red-600'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          {activeTab === 0 && (
            <PersonalInfo 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 1 && (
            <ProfessionalInfo 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 2 && (
            <BankDetails 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 3 && (
            <MediaGallery 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 4 && (
            <SkillsExpertise 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 5 && (
            <Consultations 
              astrologerId={astrologerId || ''} 
              initialData={astrologer} 
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 6 && (
            <FirstTimeOfferManagement
              astrologerId={astrologerId || ''} 
              initialData={astrologer}
              onUpdate={fetchAstrologer}
            />
          )}
          {activeTab === 7 && (
            <ReportsAndAvailability
              astrologerId={astrologerId || ''} 
              initialData={astrologer}
              onUpdate={fetchAstrologer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
