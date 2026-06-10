'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface RechargeDetail {
  rechargeAmount: string;
  extraPercent: string;
  startDate: string;
  endDate: string;
  rechargeId?: string;
}

interface InputFieldError {
  rechargeAmount: string;
  extraPercent: string;
  startDate: string;
  endDate: string;
}

function AddRechargeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMode = searchParams.get('edit') === 'true';
  const rechargeId = searchParams.get('id');

  const [rechargeDetail, setRechargeDetail] = useState<RechargeDetail>({ 
    rechargeAmount: '', 
    extraPercent: '', 
    startDate: '', 
    endDate: '' 
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ 
    rechargeAmount: '', 
    extraPercent: '', 
    startDate: '', 
    endDate: '' 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode);

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Fetch recharge data if in edit mode
  useEffect(() => {
    const fetchRechargeData = async () => {
      if (editMode && rechargeId) {
        try {
          setFetching(true);
          const response = await fetch(`/api/admin/get-recharge-plan/${rechargeId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setRechargeDetail({ 
              rechargeAmount: data.data.amount?.toString() || '',
              extraPercent: data.data.percentage?.toString() || '',
              startDate: formatDate(data.data.startDate) || '',
              endDate: formatDate(data.data.endDate) || '',
              rechargeId: data.data._id
            });
          }
        } catch (error) {
          console.error('Error fetching recharge plan:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to fetch recharge plan data',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchRechargeData();
  }, [editMode, rechargeId]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) => 
    setInputFieldError((prev) => ({ ...prev, [input]: value }));

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'rechargeAmount') {
      if (value && parseFloat(value) < 1) {
        setInputFieldError({ ...inputFieldError, rechargeAmount: 'Amount must be greater than 0' });
      } else {
        setInputFieldError({ ...inputFieldError, rechargeAmount: '' });
      }
    }
    
    if (name === 'extraPercent') {
      if (value && parseFloat(value) < 0) {
        setInputFieldError({ ...inputFieldError, extraPercent: 'Percentage cannot be negative' });
      } else {
        setInputFieldError({ ...inputFieldError, extraPercent: '' });
      }
    }
    
    setRechargeDetail({ ...rechargeDetail, [name]: value });
  };

  //! Handle validation
  const handleValidation = () => {
    let isValid = true;
    const { rechargeAmount, extraPercent, startDate, endDate } = rechargeDetail;

    if (!rechargeAmount) {
      handleInputFieldError("rechargeAmount", "Please Enter Recharge Amount");
      isValid = false;
    } else if (parseFloat(rechargeAmount) < 1) {
      handleInputFieldError("rechargeAmount", "Please Enter Amount Greater Than 0");
      isValid = false;
    }

    if (!extraPercent) {
      handleInputFieldError("extraPercent", "Please Enter Extra Percent");
      isValid = false;
    }

    if (!startDate) {
      handleInputFieldError("startDate", "Please Select Start Date");
      isValid = false;
    }

    if (!endDate) {
      handleInputFieldError("endDate", "Please Select End Date");
      isValid = false;
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      handleInputFieldError("endDate", "End date cannot be before start date");
      isValid = false;
    }

    return isValid;
  };

  // Create Recharge Plan API call
  const createRechargePlan = async (rechargeData: {
    amount: string;
    percentage: string;
    startDate: string;
    endDate: string;
    status: string;
  }) => {
    try {
      console.log("📤 Creating recharge plan with payload:", rechargeData);
      
      const response = await fetch(`/api/admin/create_recharge_plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount:rechargeData.amount,
          percentage: rechargeData.percentage,
          startDate: rechargeData.startDate,
          endDate: rechargeData.endDate,
          status: rechargeData.status
        }),
      });

      console.log("📥 Response status:", response.status);
      
      const result = await response.json();
      console.log("📦 API Response:", result);
      
      return result;
    } catch (error) {
      console.error('❌ Error creating recharge plan:', error);
      throw error;
    }
  };

  // Update Recharge Plan API call
  const updateRechargePlan = async (rechargeData: { 
    amount: string;
    percentage: string;
    startDate: string;
    endDate: string;
    status: string;
    rechargeId: string;
  }) => {
    try {
      console.log("📤 Updating recharge plan with payload:", rechargeData);
      
      const response = await fetch(`/api/admin/update-recharge-plan/${rechargeData.rechargeId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          amount: parseFloat(rechargeData.amount),
          percentage: parseFloat(rechargeData.percentage),
          startDate: rechargeData.startDate,
          endDate: rechargeData.endDate,
          status: rechargeData.status
        }),
      });

      console.log("📥 Response status:", response.status);
      
      const result = await response.json();
      console.log("📦 API Response:", result);
      
      return result;
    } catch (error) {
      console.error('❌ Error updating recharge plan:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating Recharge Plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔄 Submit triggered, editMode:", editMode);
    
    if (handleValidation()) {
      setLoading(true);
      const { rechargeAmount, extraPercent, startDate, endDate, rechargeId } = rechargeDetail;

      try {
        if (editMode && rechargeId) {
          // Update existing recharge plan
          const result = await updateRechargePlan({
            amount: rechargeAmount,
            percentage: extraPercent,
            startDate: startDate,
            endDate: endDate,
            status: "Active",
            rechargeId: rechargeId
          });
          
          if (result.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Recharge plan updated successfully!',
              showConfirmButton: false,
              timer: 1500
            });
            router.push("/recharge");
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: result.message || 'Failed to update recharge plan',
            });
          }
        } else {
          // Create new recharge plan
          const result = await createRechargePlan({
            amount: rechargeAmount,
            percentage: extraPercent,
            startDate: startDate,
            endDate: endDate,
            status: "Active"
          });
          
          if (result.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Recharge plan created successfully!',
              showConfirmButton: false,
              timer: 1500
            });
            router.push("/recharge");
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: result.message || 'Failed to create recharge plan',
            });
          }
        }
      } catch (error) {
        console.error('❌ Error submitting recharge plan:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while submitting the recharge plan',
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.log("❌ Validation failed");
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading recharge plan data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit' : 'Add'} Recharge Plan
          </div>
          <button 
            onClick={() => router.push("/recharge")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recharge Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Recharge Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rechargeAmount"
              min="1"
              value={rechargeDetail.rechargeAmount}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("rechargeAmount", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                inputFieldError.rechargeAmount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter recharge amount"
            />
            {inputFieldError.rechargeAmount && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.rechargeAmount}</p>
            )}
          </div>

          {/* Extra Percentage */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Extra Percentage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="extraPercent"
              min="0"
              step="0.01"
              value={rechargeDetail.extraPercent}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("extraPercent", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                inputFieldError.extraPercent ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter extra percentage"
            />
            {inputFieldError.extraPercent && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.extraPercent}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={rechargeDetail.startDate}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("startDate", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                inputFieldError.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {inputFieldError.startDate && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={rechargeDetail.endDate}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("endDate", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                inputFieldError.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {inputFieldError.endDate && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.endDate}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editMode ? 'Update' : 'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AddRecharge = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddRechargeContent />
    </Suspense>
  );
};

export default AddRecharge;