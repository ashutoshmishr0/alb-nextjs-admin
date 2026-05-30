// app/customer/page.tsx
'use client';

import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeepSearchSpace, IndianRupee } from '@/utils/common-function/index';
import MainDatatable from '@/components/common/MainDatatable';
import { EditSvg, ViewSvg, WalletSvg } from '@/components/svgs/page';
import Swal from 'sweetalert2';
import { Tooltip } from '@mui/material';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Customer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  wallet_balance: number;
  dateOfBirth: string;
  timeOfBirth: string;
  isDeleted?: number;        // 👈 add
  banned_status: boolean;
  email?: string;
  gender?: string;
  image?: string;
  createdAt: string
}

interface ApiResponse {
  success: boolean;
  customers: Customer[];
}

// ---------------------------------------------------------------------
// SVG Toggle Switches
// ---------------------------------------------------------------------
const SwitchOnSvg = () => (
  <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="24" rx="12" fill="#22C55E" />
    <circle cx="30" cy="12" r="8" fill="white" />
  </svg>
);

const SwitchOffSvg = () => (
  <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="24" rx="12" fill="#EF4444" />
    <circle cx="14" cy="12" r="8" fill="white" />
  </svg>
);

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
export default function Customer() {
  const router = useRouter();

  // State
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const filteredData = DeepSearchSpace(customerData, searchText);

  const [walletModal, setWalletModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [inputFieldDetail, setInputFieldDetail] = useState({ amount: '', type: '' });
  const [inputFieldError, setInputFieldError] = useState({ amount: '', type: '' });

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-all-customers`, {
          credentials: 'include'
        }
        );
        const data: ApiResponse = await res.json();

        if (data.success && Array.isArray(data.customers)) {
          // Sort descending by createdAt (latest first)
          const sortedCustomers = data.customers.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setCustomerData(sortedCustomers);
        } else {
          console.error('Invalid API response structure', data);
          setCustomerData([]);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomerData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Wallet Modal
  const handleWalletModalOpen = (id: string) => {
    setUserId(id);
    setWalletModal(true);
  };

  const handleWalletModalClose = () => {
    setWalletModal(false);
    setInputFieldDetail({ amount: '', type: '' });
    setInputFieldError({ amount: '', type: '' });
  };

  const handleInputFieldError = (input: string, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  const handleInputField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputFieldDetail({ ...inputFieldDetail, [name]: value });
  };

  const handleValidation = () => {
    let isValid = true;

    const { amount, type } = inputFieldDetail;
    if (!amount) {
      handleInputFieldError("amount", "Please Enter Amount");
      isValid = false;
    } else if (Number(amount) <= 0) {
      handleInputFieldError("amount", "Please Enter Amount Greater Than Zero");
      isValid = false;
    } else {
      handleInputFieldError("amount", "");
    }

    if (!type) {
      handleInputFieldError("type", "Please Select Type");
      isValid = false;
    } else {
      handleInputFieldError("type", "");
    }
    return isValid;
  };

  // Delete (soft-delete) toggle
  const handleDeleteToggle = async (customer: Customer) => {
    const currentDeleted = customer.isDeleted === 1;
    const newDeleted = !currentDeleted;
    const action = newDeleted ? 'delete' : 'restore';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You want to ${action} this customer?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newDeleted ? '#d33' : '#3085d6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} customer!`,
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: `${newDeleted ? 'Deleting' : 'Restoring'}...`,
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const payload = {
      customerId: customer._id,
      isDeleted: newDeleted,       // 👈 this triggers isDeleted update only
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/change-banned-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomerData((prev) =>
          prev.map((cust) =>
            cust._id === customer._id
              ? { ...cust, isDeleted: data.data.isDeleted }
              : cust
          )
        );

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Customer ${newDeleted ? 'marked as deleted' : 'restored'
            } successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || 'Failed to update delete status');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
      });
    }
  };

  const handleSubmit = () => {
    if (!handleValidation()) return;

    Swal.fire({
      title: 'Updating Wallet...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const payload = {
      transactions: [{ customerId: userId, amount: Number(inputFieldDetail.amount) }],
      type: inputFieldDetail.type
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add_deduct_customer_wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON response');
        }
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        return data;
      })
      .then(data => {
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Wallet updated successfully!',
            timer: 2000,
            showConfirmButton: false
          });
          handleWalletModalClose();
          refetchCustomers();
        } else {
          throw new Error(data.message || 'Update failed');
        }
      })
      .catch(error => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message
        });
      });
  };

  const refetchCustomers = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-all-customers`, {
        credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.customers)) {
          setCustomerData(data.customers);
        }
      })
      .catch(console.error);
  };

  // Status Toggle
  const handleStatusToggle = async (customer: Customer) => {
    const newStatus = !customer.banned_status;
    const action = newStatus ? 'ban' : 'unban';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You want to ${action} this customer?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#d33' : '#3085d6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} customer!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: `${action === 'ban' ? 'Banning' : 'Unbanning'}...`,
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const payload = {
      customerId: customer._id,
      customerName: customer.customerName,
      status: newStatus
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/change-banned-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomerData(prev =>
          prev.map(cust =>
            cust._id === customer._id
              ? { ...cust, banned_status: data.data.banned_status }
              : cust
          )
        );

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Customer ${action === 'ban' ? 'banned' : 'unbanned'} successfully`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to update');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  // Edit Navigation
  const handleEditCustomer = (customer: Customer) => {
    const params = new URLSearchParams({
      id: customer._id,
      customerName: customer.customerName,
      phoneNumber: customer.phoneNumber,
      gender: customer.gender || '',
      wallet_balance: customer.wallet_balance.toString(),
      dateOfBirth: customer.dateOfBirth,
      timeOfBirth: customer.timeOfBirth,
      image: customer.image || '',
    });
    router.push(`/customer/add-customer?${params.toString()}`);
  };

  // Table Columns
  const columns = [
    {
      name: "S.No.",
      selector: (row: Customer) => customerData.indexOf(row) + 1,
      width: "40px"
    },
    {
      name: "Customer Name",
      cell: (row: Customer) => {
        const customerName = row?.customerName?.trim() || "";
        return (
          <Tooltip title={customerName}>
            <span className="truncate block w-full">{customerName}</span>
          </Tooltip>
        );
      },
      width: "200px",
    },
    {
      name: "Email",
      cell: (row: Customer) => {
        const email = row?.email?.trim() || "";
        return (
          <Tooltip title={email}>
            <span className="truncate block w-full">{email}</span>
          </Tooltip>
        );
      },
      width: "200px",
    },
    {
      name: "Contact",
      selector: (row: Customer) => row?.phoneNumber,
      width: '130px'
    },
    // {
    //   name: "Wallet",
    //   selector: (row: Customer) => IndianRupee(row?.wallet_balance) || '',
    //   width: '130px'
    // },
    {
      name: "D.O.B",
      selector: (row: Customer) => row?.dateOfBirth ? moment(row.dateOfBirth).format('DD/MM/YYYY') : '',
      width: '120px'
    },
    {
      name: "T.O.B",
      selector: (row: Customer) => {
        const val = row?.timeOfBirth;
        if (!val) return '';
        try {
          const m = moment(val); // ISO string parse ho jayega
          return m.isValid() ? m.format('hh:mm A') : '';
        } catch {
          return '';
        }
      },
      width: '120px'
    },
    {
      name: 'is Not Ban',
      selector: (row: Customer) => (
        <div
          className="cursor-pointer flex justify-center"
          onClick={() => handleStatusToggle(row)}
        >
          {row.banned_status ? <SwitchOffSvg /> : <SwitchOnSvg />}
        </div>
      ),
      width: '120px',
    },
    {
      name: 'is Not Delete',
      selector: (row: Customer) => {
        const isDeleted = row.isDeleted === 1;
        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() => handleDeleteToggle(row)}
          >
            {isDeleted ? (
              // red toggle when deleted
              <SwitchOffSvg />
            ) : (
              // green toggle when active
              <SwitchOnSvg />
            )}
          </div>
        );
      },
      width: '120px',
    },
    {
      name: 'Action',
      cell: (row: Customer) => (
        <div className="flex gap-5 justify-center items-center">
          <div
            onClick={() => router.push(`/customer/view-customer?id=${row._id}`)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            <ViewSvg />
          </div>
          <div
            onClick={() => handleEditCustomer(row)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            <EditSvg />
          </div>
          {/* <div
            onClick={() => handleWalletModalOpen(row._id)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            <WalletSvg />
          </div> */}
        </div>
      ),
      width: "150px",
      center: "true"
    },
  ];

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      <MainDatatable
        columns={columns.map((col) => ({
          ...col,
          minwidth: col.width,
          width: undefined,
        }))}
        data={filteredData}
        title="Customer"
        isLoading={loading}
        url="/customer/add-customer"
      />

      {/* Wallet Modal - Tailwind */}
      {walletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium text-gray-900">Wallet</h2>
                <button
                  onClick={handleWalletModalClose}
                  className="text-3xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={inputFieldDetail.amount}
                    onChange={handleInputField}
                    onFocus={() => handleInputFieldError("amount", "")}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${inputFieldError.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter amount"
                  />
                  {inputFieldError.amount && (
                    <p className="text-red-500 text-xs mt-1">{inputFieldError.amount}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={inputFieldDetail.type}
                    onChange={handleInputField}
                    onFocus={() => handleInputFieldError("type", "")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${inputFieldError.type ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="" disabled>---Select Type---</option>
                    <option value="credit">Add</option>
                    <option value="deduct">Deduct</option>
                  </select>
                  {inputFieldError.type && (
                    <p className="text-red-500 text-xs mt-1">{inputFieldError.type}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium text-sm rounded-md hover:bg-red-700 transition-colors"
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
}