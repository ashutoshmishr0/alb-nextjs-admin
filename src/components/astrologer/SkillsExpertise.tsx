// components/astrologer/SkillsExpertise.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';

interface Skill {
  _id: string;
  skill: string;
}

interface Expertise {
  _id: string;
  mainExpertise: string;
}

interface Remedy {
  _id: string;
  title: string;
}

interface Category {
  _id: string;
  categories: string;
}

interface SkillsExpertiseProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function SkillsExpertise({ astrologerId, initialData, onUpdate }: SkillsExpertiseProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedRemedies, setSelectedRemedies] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [originalSkills, setOriginalSkills] = useState<string[]>([]);
  const [originalExpertise, setOriginalExpertise] = useState<string[]>([]);
  const [originalRemedies, setOriginalRemedies] = useState<string[]>([]);
  const [originalCategories, setOriginalCategories] = useState<string[]>([]);

  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [allExpertise, setAllExpertise] = useState<Expertise[]>([]);
  const [allRemedies, setAllRemedies] = useState<Remedy[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Safe function to extract IDs
  const safeExtractIds = (items: any[] | undefined | null): string[] => {
    if (!items || !Array.isArray(items)) return [];
    return items
      .filter(item => item && typeof item === 'object' && item._id)
      .map(item => item._id);
  };

  // Fetch all lists
  useEffect(() => {
    fetchData();
  }, []);

  // Set selected values when initialData arrives
  useEffect(() => {
    
    if (initialData && allExpertise.length > 0) {
      
      const initialSkills = safeExtractIds(initialData?.skill);
      const initialExpertise = safeExtractIds(initialData?.mainExpertise);
      const initialRemedies = safeExtractIds(initialData?.remedies);
      const initialCategories = safeExtractIds(initialData?.categories);
            
      setSelectedSkills(initialSkills);
      setSelectedExpertise(initialExpertise);
      setSelectedRemedies(initialRemedies);
      setSelectedCategories(initialCategories);
      
      setOriginalSkills(initialSkills);
      setOriginalExpertise(initialExpertise);
      setOriginalRemedies(initialRemedies);
      setOriginalCategories(initialCategories);
    }
  }, [initialData, allExpertise.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, expertiseRes, remediesRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/get-skill`),
        fetch(`/api/admin/get-all-main-expertise`),
        fetch(`/api/admin/view-remedy`),
        fetch(`/api/admin/view-categories`)
      ]);

      const [skillsData, expertiseData, remediesData, categoriesData] = await Promise.all([
        skillsRes.json(),
        expertiseRes.json(),
        remediesRes.json(),
        categoriesRes.json()
      ]);

      if (skillsData.success) setAllSkills(skillsData.skills || []);
      if (expertiseData.success) setAllExpertise(expertiseData.mainExpertise || []);
      if (remediesData.success) setAllRemedies(remediesData.remedies || []);
      if (categoriesData.success) setAllCategories(categoriesData.categories || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {    
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId);
      let newSelected;
      if (isSelected) {
        newSelected = prev.filter(id => id !== categoryId);
      } else {
        newSelected = [...prev, categoryId];
      }
      return newSelected;
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleExpertise = (expertiseId: string) => {
    setSelectedExpertise(prev =>
      prev.includes(expertiseId)
        ? prev.filter(id => id !== expertiseId)
        : [...prev, expertiseId]
    );
  };

  const toggleRemedy = (remedyId: string) => {
    setSelectedRemedies(prev =>
      prev.includes(remedyId)
        ? prev.filter(id => id !== remedyId)
        : [...prev, remedyId]
    );
  };

  const hasChanges = () => {
    const skillsChanged = JSON.stringify([...selectedSkills].sort()) !== JSON.stringify([...originalSkills].sort());
    const expertiseChanged = JSON.stringify([...selectedExpertise].sort()) !== JSON.stringify([...originalExpertise].sort());
    const remediesChanged = JSON.stringify([...selectedRemedies].sort()) !== JSON.stringify([...originalRemedies].sort());
    const categoriesChanged = JSON.stringify([...selectedCategories].sort()) !== JSON.stringify([...originalCategories].sort());
    
    return skillsChanged || expertiseChanged || remediesChanged || categoriesChanged;
  };

  const handleSubmit = async () => {
    if (!hasChanges()) {
      toast.info('No changes to update');
      return;
    }

    if (selectedSkills.length === 0) {
      toast.error('Select at least one skill');
      return;
    }

    if (selectedExpertise.length === 0) {
      toast.error('Select at least one expertise');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        astrologerId,
        astrologerName: initialData?.astrologerName || '',
        displayName: initialData?.displayName || '',
        title: initialData?.title || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        alternateNumber: initialData?.alternateNumber || '',
        country_phone_code: initialData?.country_phone_code || '91',
        gender: initialData?.gender || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        address: initialData?.address || '',
        country: initialData?.country || 'India',
        state: initialData?.state || '',
        city: initialData?.city || '',
        zipCode: initialData?.zipCode || '',
        password: initialData?.password || '',
        confirm_password: initialData?.confirm_password || initialData?.password || '',
        
        experience: initialData?.experience || '',
        about: initialData?.about || '',
        short_bio: initialData?.short_bio || '',
        long_bio: initialData?.long_bio || '',
        youtubeLink: initialData?.youtubeLink || '',
        tagLine: initialData?.tagLine || '',
        language: initialData?.language || [],
        workingOnOtherApps: initialData?.workingOnOtherApps || 'No',
        
        skill: selectedSkills,
        mainExpertise: selectedExpertise,
        remedies: selectedRemedies,
        categories: selectedCategories,
        expertise: initialData?.expertise || [],
        preferredDays: initialData?.preferredDays || [],
        
        account_holder_name: initialData?.account_holder_name || '',
        account_number: initialData?.account_number || '',
        account_type: initialData?.account_type || '',
        IFSC_code: initialData?.IFSC_code || '',
        account_name: initialData?.account_name || '',
        panCard: initialData?.panCard || '',
        aadharNumber: initialData?.aadharNumber || '',
        
        free_min: initialData?.free_min || 0,
        consultation: initialData?.consultation || '1000',
        chat_price: initialData?.chat_price || null,
        call_price: initialData?.call_price || null,
        video_call_price: initialData?.video_call_price || 0,
        normal_video_call_price: initialData?.normal_video_call_price || 0,
        
        consultation_commission: initialData?.consultation_commission || 0,
        commission_call_price: initialData?.commission_call_price || '0',
        commission_chat_price: initialData?.commission_chat_price || '0',
        commission_video_call_price: initialData?.commission_video_call_price || 0,
        commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
        consultation_call_price: initialData?.consultation_call_price || null,
        consultation_chat_price: initialData?.consultation_chat_price || null,
        consultation_videocall_price: initialData?.consultation_videocall_price || null,
        consultation_commission_call: initialData?.consultation_commission_call || null,
        consultation_commission_chat: initialData?.consultation_commission_chat || null,
        consultation_commission_videocall: initialData?.consultation_commission_videocall || null,
        gift_commission: initialData?.gift_commission || 0,
        
        follower_count: initialData?.follower_count || 0,
        totalCallDuration: initialData?.totalCallDuration || 0,
        totalChatDuration: initialData?.totalChatDuration || 0,
        totalVideoCallDuration: initialData?.totalVideoCallDuration || 0,
        currency: initialData?.currency || 'INR',
        
        isDealInReport: initialData?.isDealInReport || false,
        reportTypes: initialData?.reportTypes || [],
      };

      const response = await fetch(
        `/api/admin/update-astrologer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Skills & expertise updated successfully');
        setOriginalSkills(selectedSkills);
        setOriginalExpertise(selectedExpertise);
        setOriginalRemedies(selectedRemedies);
        setOriginalCategories(selectedCategories);
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
  

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Skills & Expertise</h2>
        <p className="text-gray-600 text-sm">Select skills, expertise areas, remedies, and categories</p>
      </div>

      {/* Main Expertise Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Main Expertise <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Primary areas of astrological expertise</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {selectedExpertise.length} selected
          </span>
        </div>
        {allExpertise.length === 0 ? (
          <p className="text-gray-500 text-sm">No expertise available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allExpertise.map(expertise => {
              const isSelected = selectedExpertise.includes(expertise._id);
              return (
                <div
                  key={expertise._id}
                  onClick={() => toggleExpertise(expertise._id)}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-red-50 border-red-500'
                      : 'bg-white border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    isSelected ? 'bg-red-600' : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {expertise.mainExpertise}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Skills <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Astrological skills and specializations</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {selectedSkills.length} selected
          </span>
        </div>
        {allSkills.length === 0 ? (
          <p className="text-gray-500 text-sm">No skills available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allSkills.map(skill => {
              const isSelected = selectedSkills.includes(skill._id);
              return (
                <div
                  key={skill._id}
                  onClick={() => toggleSkill(skill._id)}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-red-50 border-red-500'
                      : 'bg-white border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    isSelected ? 'bg-red-600' : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {skill.skill}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remedies Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Remedies</h3>
            <p className="text-sm text-gray-600 mt-1">Astrological remedies and solutions offered</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {selectedRemedies.length} selected
          </span>
        </div>
        {allRemedies.length === 0 ? (
          <p className="text-gray-500 text-sm">No remedies available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allRemedies.map(remedy => {
              const isSelected = selectedRemedies.includes(remedy._id);
              return (
                <div
                  key={remedy._id}
                  onClick={() => toggleRemedy(remedy._id)}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-red-50 border-red-500'
                      : 'bg-white border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    isSelected ? 'bg-red-600' : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {remedy.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories Section - WITH FULL DEBUG */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <p className="text-sm text-gray-600 mt-1">Astrological service categories</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {selectedCategories.length} selected
          </span>
        </div>
        {allCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allCategories.map((category, index) => {
              const isSelected = selectedCategories.includes(category._id);
              return (
                <div
                  key={category._id}
                  onClick={() => toggleCategory(category._id)}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-red-50 border-red-500'
                      : 'bg-white border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    isSelected ? 'bg-red-600' : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {category.categories}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !hasChanges()}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Update Skills & Expertise
            </>
          )}
        </button>
      </div>
    </div>
  );
}