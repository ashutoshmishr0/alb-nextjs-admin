// app/admin/reports/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tooltip } from '@mui/material';
import Swal from 'sweetalert2';
import MainDatatable from '@/components/common/MainDatatable';
import { EditSvg, ViewSvg, DeleteSvg } from '@/components/svgs/page';
import { DeepSearchSpace } from '@/utils/common-function/index';

// Types
interface Report {
  _id: string;
  title: string;
  slug: string;
  imageUrl: string;
  category: string;
  price: number;
  cutPrice: number;
  rating: number;
  showOnMobile: boolean;
  reviews: number;
  featured: boolean;
  bestseller: boolean;
  tag: string;
  newlyLaunched: boolean;
  description: string;
  displayOrder: number;
  sectionPriority: 'hero' | 'featured' | 'regular' | 'hidden';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// SVG Toggles (same as customer page)
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

// Drag Handle SVG
const DragHandleSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L9 18M15 6L15 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function ReportsAdmin() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [orderModal, setOrderModal] = useState(false);
  const [draggedReports, setDraggedReports] = useState<Report[]>([]);
  const draggedItemIndex = useRef<number | null>(null);

  // Fetch Reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/all`);
      const data = await response.json();

      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered data
  const filteredData = DeepSearchSpace(reports, searchText);

  // Toggle Active Status (Soft Delete/Activate)
  const handleToggleActive = async (report: Report) => {
    const newStatus = !report.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You want to ${action} this report?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#22C55E' : '#EF4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} report!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: `${action === 'activate' ? 'Activating' : 'Deactivating'}...`,
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const response = await fetch(`/api/admin/${report._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReports(prev =>
          prev.map(r =>
            r._id === report._id ? { ...r, isActive: newStatus } : r
          )
        );

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Report ${action}d successfully`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  // Delete Report (Hard Delete)
  const handleDeleteReport = async (report: Report) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to permanently delete "${report.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const response = await fetch(`/api/admin/${report._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReports(prev => prev.filter(r => r._id !== report._id));

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Report deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  // Open Order Management Modal
  const handleOpenOrderModal = () => {
    // Sort by displayOrder
    const sortedReports = [...reports].sort((a, b) => a.displayOrder - b.displayOrder);
    setDraggedReports(sortedReports);
    setOrderModal(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    draggedItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex.current === null || draggedItemIndex.current === index) return;

    setDraggedReports(prev => {
      const newReports = [...prev];
      const draggedItem = newReports[draggedItemIndex.current!];
      newReports.splice(draggedItemIndex.current!, 1);
      newReports.splice(index, 0, draggedItem);
      return newReports;
    });

    draggedItemIndex.current = index; // ref update → no re-render
  };

  const handleDragEnd = () => {
    draggedItemIndex.current = null;
  };

  // Save New Order
  const handleSaveOrder = async () => {
    Swal.fire({
      title: 'Saving Order...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const orders = draggedReports.map((report, index) => ({
      id: report._id,
      displayOrder: index + 1,
      sectionPriority: report.sectionPriority
    }));

    try {
      const response = await fetch(`/api/admin/orders/bulk`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with new orders
        setReports(draggedReports);
        setOrderModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Report order updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to update order');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  const handleToggleMobile = async (report: Report) => {
  const newStatus = !report.showOnMobile;

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `This report will ${newStatus ? 'appear' : 'be hidden'} on mobile`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: newStatus ? '#22C55E' : '#EF4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Yes, ${newStatus ? 'show' : 'hide'} on mobile!`,
  });

  if (!result.isConfirmed) return;

  Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const response = await fetch(`/api/admin/${report._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showOnMobile: newStatus }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setReports(prev =>
        prev.map(r => r._id === report._id ? { ...r, showOnMobile: newStatus } : r)
      );
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
    } else {
      throw new Error(data.message || 'Failed to update');
    }
  } catch (error: any) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
  }
};

  // Update Section Priority
  const handleUpdateSection = async (report: Report, newSection: Report['sectionPriority']) => {
    try {
      const response = await fetch(`/api/admin/${report._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionPriority: newSection })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReports(prev =>
          prev.map(r =>
            r._id === report._id ? { ...r, sectionPriority: newSection } : r
          )
        );

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Section priority changed to ${newSection}`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to update section');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  // Table Columns
  const columns = [
    {
      name: "S.No.",
      selector: (row: Report) => reports.indexOf(row) + 1,
      width: "60px"
    },
    {
      name: "Display Order",
      selector: (row: Report) => row.displayOrder,
      width: "100px",
      cell: (row: Report) => (
        <span className="font-mono font-semibold text-blue-600">
          #{row.displayOrder}
        </span>
      )
    },
    {
      name: "Report Image",
      cell: (row: Report) => (
        <div className="relative w-6 h-8 rounded overflow-hidden bg-gray-100">
          <Image
            src={row.imageUrl}
            alt={row.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ),
      width: "80px"
    },
    {
      name: "Title",
      cell: (row: Report) => {
        const title = row?.title?.trim() || "";
        return (
          <Tooltip title={title}>
            <span className="truncate block w-full font-medium">{title}</span>
          </Tooltip>
        );
      },
      width: "200px",
    },
    {
      name: "Category",
      selector: (row: Report) => row.category,
      width: "200px",
      cell: (row: Report) => (
        <span className="px-1 py-1 bg-gray-100 rounded-full text-xs">
          {row.category}
        </span>
      )
    },
    {
      name: "Price",
      cell: (row: Report) => (
        <div>
          <span className="line-through text-gray-400 text-xs mr-1">
            ₹{row.cutPrice}
          </span>
          <span className="font-bold text-red-600">₹{row.price}</span>
        </div>
      ),
      width: "120px"
    },
    {
      name: "Rating",
      cell: (row: Report) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span>{row.rating}</span>
          <span className="text-gray-400 text-xs">({row.reviews})</span>
        </div>
      ),
      width: "100px"
    },
    {
      name: "Section",
      cell: (row: Report) => (
        <select
          value={row.sectionPriority}
          onChange={(e) => handleUpdateSection(row, e.target.value as Report['sectionPriority'])}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hero">Hero</option>
          <option value="featured">Featured</option>
          <option value="regular">Regular</option>
          <option value="hidden">Hidden</option>
        </select>
      ),
      width: "120px"
    },
    {
      name: "Status",
      selector: (row: Report) => (
        <div
          className="cursor-pointer flex justify-center"
          onClick={() => handleToggleActive(row)}
        >
          {row.isActive ? <SwitchOnSvg /> : <SwitchOffSvg />}
        </div>
      ),
      width: "100px",
    },
    {
      name: "Mobile",
      cell: (row: Report) => (
        <div
          className="cursor-pointer flex justify-center"
          onClick={() => handleToggleMobile(row)}
        >
          {row.showOnMobile ? <SwitchOnSvg /> : <SwitchOffSvg />}
        </div>
      ),
      width: "100px",
    },
    {
      name: 'Action',
      cell: (row: Report) => (
        <div className="flex gap-3 justify-center items-center">
          <div
            onClick={() => router.push(`/reports/change-reports-order/edit-report?id=${row._id}`)}
            className="cursor-pointer hover:text-green-600 transition-colors"
          >
            <EditSvg />
          </div>
          <div
            onClick={() => handleDeleteReport(row)}
            className="cursor-pointer hover:text-red-600 transition-colors"
          >
            <DeleteSvg />
          </div>
        </div>
      ),
      width: "120px",
    },
  ];

  return (
    <>
      <div className="mb-4 mt-10 mr-10 flex justify-end gap-3">
        <button
          onClick={handleOpenOrderModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <DragHandleSvg />
          Reorder Reports
        </button>
        <button
          onClick={() => router.push('/reports/add-report')}
          className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          {/* <PlusSvg /> */}
          Add New Report
        </button>
      </div>

      <MainDatatable
        columns={columns.map((col) => ({
          ...col,
          minwidth: col.width,
          width: undefined,
        }))}
        data={filteredData}
        title="Reports Management"
        isLoading={loading}
        url="/reports/add-report"
      />

      {orderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medium text-gray-900">
                  Reorder Reports
                </h2>
                <button
                  onClick={() => setOrderModal(false)}
                  className="text-3xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop to reorder reports. This will affect display order across the website.
              </p>
            </div>

            {/* Drag and Drop List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {draggedReports.map((report, index) => (
                  <div
                    key={report._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="bg-white border rounded-lg p-4 cursor-move transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <DragHandleSvg />
                      </div>

                      {/* Order Number */}
                      <div className="w-12 text-center">
                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      </div>

                      {/* Image */}
                      <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={report.imageUrl}
                          alt={report.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">{report.category}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">₹{report.price}</span>
                        </div>
                      </div>

                      {/* Section Badge */}
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded-full ${report.sectionPriority === 'hero' ? 'bg-purple-100 text-purple-800' :
                          report.sectionPriority === 'featured' ? 'bg-yellow-100 text-yellow-800' :
                            report.sectionPriority === 'regular' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {report.sectionPriority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setOrderModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}