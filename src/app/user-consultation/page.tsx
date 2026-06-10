'use client';

import ChatWithAstrologer from '@/components/ChatWithAstrologer';
import TopHeaderSection from '@/components/common/TopHeaderSection';
import { MainExpertise } from '@/types/astrologers';
import { Filter, X, Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ASTROLOGER' | 'ADMIN';
  profileImage?: string;
}

const ConsultationPage: React.FC = () => {
  const router = useRouter();

  const [selectedExpertiseId, setSelectedExpertiseId] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [astrologerSearchText, setAstrologerSearchText] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [showAllCategories, setShowAllCategories] = useState(true); 
  
  const [displayItems, setDisplayItems] = useState<MainExpertise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

    const handleLogout = async () => {
    if (user?.role === 'CUSTOMER') {
      // Clear customer data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('customer_id');
      localStorage.removeItem('customer_phone');
      localStorage.removeItem('customer_name');
      localStorage.removeItem('customer_email');
      localStorage.removeItem('customer_data');
      localStorage.removeItem('customer_image');
    } else if (user?.role === 'ASTROLOGER') {
      // Clear astrologer data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('astrologer_id');
      localStorage.removeItem('astrologer_phone');
      localStorage.removeItem('astrologer_name');
      localStorage.removeItem('astrologer_email');
      localStorage.removeItem('astrologer_data');
      localStorage.removeItem('astrologer_image');
      localStorage.removeItem('fcm_token');
    }

    localStorage.clear();
    setUser(null);
    // window.location.href = '/';
  };

  useEffect(() => {
    const fetchMainExpertise = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/get-all-main-expertise`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (data.success && data.mainExpertise) {
          setDisplayItems(data.mainExpertise);
        } else {
          setDisplayItems([]);
        }
      } catch (err) {
        console.error('Error fetching main expertise:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setDisplayItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMainExpertise();
  }, []);

  const categorizedExpertise = useMemo(() => {
    const groups: { [key: string]: MainExpertise[] } = {};
    
    displayItems.forEach(item => {
      const categoryName = item.mainExpertise.includes('Birth Chart') 
        ? 'Birth Chart'
        : item.mainExpertise.includes('Numerology')
        ? 'Numerology'
        : item.mainExpertise.includes('Tarot')
        ? 'Tarot'
        : item.mainExpertise.includes('Palmistry')
        ? 'Palmistry'
        : item.mainExpertise.includes('Vastu')
        ? 'Vastu'
        : item.mainExpertise.includes('Gemstone')
        ? 'Gemstone'
        : item.mainExpertise.split(' ')[0];
      
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    
    return groups;
  }, [displayItems]);

  const categories = useMemo(() => {
    return ['All', ...Object.keys(categorizedExpertise)];
  }, [categorizedExpertise]);

  const displayedCategories = useMemo(() => {
    if (showAllCategories) {
      return categories;
    }
    return categories.slice(0, 6);
  }, [categories, showAllCategories]);

  const selectedCategory = useMemo(() => {
    if (!selectedExpertiseId) return 'All';
    
    for (const [categoryName, expertiseList] of Object.entries(categorizedExpertise)) {
      if (expertiseList.some(expertise => expertise._id === selectedExpertiseId)) {
        return categoryName;
      }
    }
    return 'All';
  }, [selectedExpertiseId, categorizedExpertise]);

  const handleCategorySelect = (category: string) => {
    if (category === 'All') {
      setSelectedExpertiseId('');
    } else {
      const categoryExpertise = categorizedExpertise[category];
      if (categoryExpertise && categoryExpertise.length > 0) {
        setSelectedExpertiseId(categoryExpertise[0]._id);
      }
    }
  };

  const clearFilters = () => {
    setSelectedExpertiseId('');
    setAstrologerSearchText('');
  };

  const hasActiveFilters = selectedExpertiseId !== '' || astrologerSearchText !== '';

  return (
    <>
      <TopHeaderSection />

      <section className="bg-white py-2 space-y-6">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-100">
            
            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
                {/* Title */}
                {/* <div className="flex-shrink-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Find Your Perfect Consultant
                  </h2>
                </div> */}
                     {/* <button
                  onClick={handleLogout}
                  className="flex items-center border-b py-4 px-1 hover:text-red-600 text-left font-semibold"
                >
                  Logout
                </button> */}

                {/* Desktop Search */}
                <div className="hidden lg:block w-full lg:w-96">
                  <div className="relative">
                    <input
                      value={astrologerSearchText}
                      onChange={(e) => setAstrologerSearchText(e.target.value)}
                      type="search"
                      placeholder="Search by name or expertise..."
                      className="w-full pl-4 pr-12 py-3 text-gray-700 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all duration-200"
                    />
                    <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-white rounded-lg p-2 transition-colors duration-200">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Search & Filter Toggle */}
              <div className="lg:hidden flex gap-2">
                <div className="flex-1 relative">
                  <input
                    value={astrologerSearchText}
                    onChange={(e) => setAstrologerSearchText(e.target.value)}
                    type="search"
                    placeholder="Search by name..."
                    className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-orange-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${
                    isFilterOpen 
                      ? 'border-[#980d0d] bg-orange-50' 
                      : 'border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <Filter className={`w-4 h-4 ${isFilterOpen ? 'text-[#980d0d]' : ''}`} />
                  {/* <span className="hidden sm:inline text-sm font-medium">Filters</span> */}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto">
          <ChatWithAstrologer
            searchText={astrologerSearchText}
            expertiseId={selectedExpertiseId}
            onCountChange={setAvailableCount}
          />
        </div>
      </section>
    </>
  );
};

export default ConsultationPage;
