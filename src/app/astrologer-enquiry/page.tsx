'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import { DeepSearchSpace } from '@/utils/common-function';
import { Color } from '@/assets/colors';
import MainDatatable from '@/components/common/MainDatatable';
import { api_url, base_url, get_enquiry_astrologer } from '@/lib/api-routes';
import { EditSvg, CrossSvg } from "@/components/svgs/page";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Astrologer {
  _id: string;
  astrologerName: string;
  email: string;
  phoneNumber: string;
  state?: string;
  experience: string;
  dateOfBirth: string;
  createdAt: string;
  isVerified?: boolean;
}

// ---------------------------------------------------------------------
// Datatable Heading Component (Tailwind)
// ---------------------------------------------------------------------
interface DatatableHeadingProps {
  title: string;
  data: Astrologer[];
}

const DatatableHeading: React.FC<DatatableHeadingProps> = ({ title, data = [] }) => {
  return (
    <div className="flex justify-between mb-5 bg-white">
      <div className="text-2xl font-medium text-black">{title}</div>

      <div className="flex gap-10 items-center">
        {data.length > 0 && (
          <CSVLink
            filename={`${title}.csv`}
            data={data}
            className="text-black text-base no-underline flex items-center gap-2 cursor-pointer"
          >
            <span className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span>
          </CSVLink>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------
const AstrologerEnquiryClient = () => {
  const router = useRouter();

  // State
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const filteredData = DeepSearchSpace(astrologers, searchText);

  // Wallet Modal
  const [walletModal, setWalletModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [inputFieldDetail, setInputFieldDetail] = useState<{
    amount: string;
    type: 'credit' | 'deduct' | '';
  }>({ amount: '', type: '' });
  const [inputFieldError, setInputFieldError] = useState<{
    amount?: string;
    type?: string;
  }>({});

  // Fetch Astrologers Data
  const fetchAstrologers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/${get_enquiry_astrologer}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.astrologerInquiry)) {
        setAstrologers(data.astrologerInquiry);
      } else {
        console.error('Unexpected data format:', data);
        setAstrologers([]);
      }
    } catch (error) {
      console.error('Error fetching astrologers:', error);
      setAstrologers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  // Verify Toggle
  const toggleVerify = async (astro: Astrologer) => {
    try {
      const response = await fetch('/api/astrologers/enquiry-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astrologerId: astro._id,
          isVerified: !(astro.isVerified ?? false),
        }),
      });

      if (response.ok) {
        setAstrologers(prev =>
          prev.map(a => 
            a._id === astro._id 
              ? { ...a, isVerified: !(a.isVerified ?? false) } 
              : a
          )
        );
      } else {
        console.error('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  // Wallet Handlers
  const openWallet = (astro: Astrologer) => {
    setUserId(astro._id);
    setWalletModal(true);
  };

  const closeWallet = () => {
    setWalletModal(false);
    setInputFieldDetail({ amount: '', type: '' });
    setInputFieldError({});
  };

  const handleInputFieldError = (field: 'amount' | 'type', msg: string | null) => {
    setInputFieldError((prev) => ({ ...prev, [field]: msg ?? undefined }));
  };

  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
  };

  const validateWallet = () => {
    let ok = true;
    const { amount, type } = inputFieldDetail;

    if (!amount) {
      handleInputFieldError('amount', 'Please Enter Amount');
      ok = false;
    } else if (Number(amount) <= 0) {
      handleInputFieldError('amount', 'Amount must be > 0');
      ok = false;
    } else {
      handleInputFieldError('amount', null);
    }

    if (!type) {
      handleInputFieldError('type', 'Please Select Type');
      ok = false;
    } else {
      handleInputFieldError('type', null);
    }
    return ok;
  };

  const submitWallet = async () => {
    if (!validateWallet()) return;

    const payload = {
      transactions: [{ astrologerId: userId, amount: Number(inputFieldDetail.amount) }],
      type: inputFieldDetail.type,
    };

    try {
      const res = await fetch('/api/astrologers/enquiry-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        closeWallet();
        fetchAstrologers();
      } else {
        throw new Error('Failed to update wallet');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns = [
    {
      name: 'S.No.',
      selector: (row: Astrologer, rowIndex?: number) => (rowIndex ?? 0) + 1,
      width: '80px',
    },
    { 
      name: 'Name', 
      selector: (row: Astrologer) => row.astrologerName,
      width: '150px' 
    },
    { 
      name: 'Email', 
      selector: (row: Astrologer) => row.email, 
      width: '240px' 
    },
    { 
      name: 'Mobile', 
      selector: (row: Astrologer) => row.phoneNumber 
    },
    // { 
    //   name: 'State', 
    //   selector: (row: Astrologer) => row.state === 'N/A' ? ' ' : row.state 
    // },
    { 
      name: 'Experience', 
      selector: (row: Astrologer) => row.experience 
    },
    {
      name: 'DOB',
      selector: (row: Astrologer) => moment(row.dateOfBirth).format('DD/MM/YYYY'),
      width: '120px',
    },
    {
      name: 'Created Date',
      selector: (row: Astrologer) => moment(row.createdAt).format('DD/MM/YYYY'),
      width: '140px',
    },
    {
      name: 'Action',
      cell: (row: Astrologer) => (
        <div className="flex gap-4 items-center justify-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/astrologer/edit-astrologer?id=${row._id}`);
            }}
            className="cursor-pointer"
          >
            <EditSvg />
          </div>
        </div>
      ),
      width: '140px',
      center: true,
    },
  ];

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      <MainDatatable 
        columns={columns} 
        data={filteredData} 
        title="Astrologer Enquiry"
        url="/astrologer/astrologer-enquiry"
        isLoading={isLoading} 
        addButtonActive={false} 
      />

      {/* Wallet Modal - Tailwind Dialog */}
      {walletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium text-black">Wallet</h2>
                <button onClick={closeWallet} className="text-gray-500 hover:text-gray-700">
                  <CrossSvg />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Amount Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={inputFieldDetail.amount}
                    onChange={handleInputField}
                    onFocus={() => handleInputFieldError('amount', null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.amount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter amount"
                  />
                  {inputFieldError.amount && (
                    <p className="text-red-500 text-xs mt-1">{inputFieldError.amount}</p>
                  )}
                </div>

                {/* Type Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={inputFieldDetail.type}
                    onChange={handleInputField}
                    onFocus={() => handleInputFieldError('type', null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      inputFieldError.type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">---Select Type---</option>
                    <option value="credit">Add</option>
                    <option value="deduct">Deduct</option>
                  </select>
                  {inputFieldError.type && (
                    <p className="text-red-500 text-xs mt-1">{inputFieldError.type}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeWallet}
                    className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitWallet}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    style={{ backgroundColor: Color.primary }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AstrologerEnquiryClient;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Astrologer Enquiry under progress...........
//     </div>
//   )
// }

// export default page
