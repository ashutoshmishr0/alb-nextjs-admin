"use client";

import React, { useEffect, useState } from "react";
import { Filters, Order, ApiResponse } from "./types";
import { useDebounce } from "@/hooks/useDebounce";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import { OrdersTable } from "./components/OrdersTable";
import { Pagination } from "./components/Pagination";
import { ViewModal } from "./components/ViewModal";
import { FilterBar } from "./components/FilterBar";

const ReportOrders: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: moment().tz("Asia/Kolkata").format("YYYY-MM-DD"),
    to: moment().tz("Asia/Kolkata").format("YYYY-MM-DD"),
    language: "all",
    reportType: "#LJR",
    status: "paid",
    reportDeliveryStatus: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 200,
    selectFirstN: undefined,
    source: undefined,
  });

  const [rows, setRows] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedFilters = useDebounce(filters, 500);

  const getAuthHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const fetchOrders = async (currentFilters: Filters, currentPage: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: currentFilters.limit.toString(),
        sortBy: "createdAt",
        sortOrder: currentFilters.sortOrder,
      };

      if (currentFilters.q) params.q = currentFilters.q;
      if (currentFilters.language && currentFilters.language !== "all")
        params.language = currentFilters.language;
      if (currentFilters.reportDeliveryStatus && currentFilters.reportDeliveryStatus !== "all")
        params.reportDeliveryStatus = currentFilters.reportDeliveryStatus;
      if (currentFilters.reportType && currentFilters.reportType !== "all")
        params.reportType = currentFilters.reportType;
      if (currentFilters.source && currentFilters.source !== "all")
        params.source = currentFilters.source;
      if (currentFilters.from && currentFilters.to) {
        params.from = currentFilters.from;
        params.to = currentFilters.to;
      } else if (currentFilters.from && !currentFilters.to) {
        params.date = currentFilters.from;
      }

      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) qs.set(key, value);
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ljr-reports?${qs.toString()}`;
      const response = await fetch(apiUrl, { headers: getAuthHeaders() });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse = await response.json();
      if (!result.success) throw new Error(result.message || "API returned error");

      const { items, pagination } = result.data;

      setRows(items || []);
      setPage(pagination?.page || 1);
      setTotalPages(pagination?.pages || 1);
      setTotalItems(pagination?.total || 0);
      setSelectedIds([]);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load orders",
        text: error instanceof Error ? error.message : "Unknown error",
        timer: 3000,
        showConfirmButton: false,
      });
      setRows([]);
      setTotalItems(0);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(debouncedFilters, page);
  }, [debouncedFilters]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders(filters, newPage);
  };

  const handleRefresh = () => fetchOrders(filters, page);

  const handleReset = () => {
    setFilters({
      q: "",
      from: "",
      to: "",
      language: "all",
      reportType: "all",
      status: "paid",
      reportDeliveryStatus: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 200,
      selectFirstN: undefined,
      source: undefined,
    });
    setPage(1);
    setSelectedIds([]);
  };

  const handleToggleRow = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleAll = () => {
    const selectableRows = rows.filter(
      (row) => row._id && row.reportDeliveryStatus !== "delivered"
    );
    if (selectedIds.length === selectableRows.length && selectableRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableRows.map((row) => row._id!));
    }
  };

  // ─── Resend Notification (Email + WhatsApp) ───────────────────────────────
const handleResendNotification = async (orderId: string, lat: string, lon: string, place: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/send-ljr-reports`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ _id: orderId, lat, lon }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to send");
    }

    await Swal.fire({
      icon: "success",
      title: "Report Generated!",
      text: `${place} — report delivered successfully`,
      timer: 3000,
      showConfirmButton: false,
    });

    fetchOrders(filters, page);
  } catch (error) {
    console.error("❌ LJR generate error:", error);
    Swal.fire({
      icon: "error",
      title: "Failed to generate report",
      text: error instanceof Error ? error.message : "Unknown error",
      timer: 2500,
      showConfirmButton: false,
    });
  }
};
  // ─── Stats ────────────────────────────────────────────────────────────────
  const failedCount = rows.filter((r) => r.reportDeliveryStatus === "failed").length;
  const deliveredCount = rows.filter((r) => r.reportDeliveryStatus === "delivered").length;
  const pendingCount = rows.filter((r) => r.reportDeliveryStatus === "pending").length;
  const processingCount = rows.filter((r) => r.reportDeliveryStatus === "processing").length;

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-x-8">
        <h1 className="font-bold text-2xl mb-4">Report Automation LJR</h1>

        {rows.length > 0 && (
          <div className="flex-1 mb-4 p-3 rounded-lg">
            <div className="flex items-center justify-end flex-wrap gap-2 mr-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-primary">
                  Total {totalItems} orders
                </span>
                <div className="flex gap-3 text-sm">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                    Failed: {failedCount}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    Delivered: {deliveredCount}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    Pending: {pendingCount}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Processing: {processingCount}
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                      ✓ Selected: {selectedIds.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onRefresh={handleRefresh}
        onReset={handleReset}
        onProcessSelected={() => {}}
        selectedCount={selectedIds.length}
      />

      <OrdersTable
        data={rows}
        loading={loading}
        page={page}
        limit={filters.limit}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        onView={(row) => {
          setActiveRow(row);
          setViewOpen(true);
        }}
        onResendNotification={handleResendNotification}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={filters.limit}
          onPageChange={handlePageChange}
        />
      )}

      {viewOpen && activeRow && (
        <ViewModal order={activeRow} onClose={() => setViewOpen(false)} />
      )}
    </div>
  );
};

export default ReportOrders;