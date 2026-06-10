"use client";

import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { DeepSearchSpace } from "@/utils/common-function";
import { Color } from "@/assets/colors";

import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, CrossSvg } from "@/components/svgs/page";
import { TableColumn } from "react-data-table-component";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface DubaiConsultation {
  _id: string;
  name: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  email: string;
  whatsappNumber: string;
  concern: string;
  countryCode: string;
  paymentStatus: string;
  razorpayOrderId: string;
  createdAt: string;
  updatedAt: string;
}

type ConsultationColumn = TableColumn<DubaiConsultation>;

export default function DubaiConsultationPage() {
  const [data, setData] = useState<DubaiConsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
const [statusFilter, setStatusFilter] = useState<
  "ALL" | "paid" | "unpaid"
>("ALL");

//   const filteredData = DeepSearchSpace(data, searchText);
const filteredData = useMemo(() => {
  let tempData = DeepSearchSpace(data, searchText);

  if (statusFilter !== "ALL") {
    tempData = tempData.filter(
      (item: any) =>
        item.paymentStatus?.toLowerCase() === statusFilter
    );
  }

  return tempData;
}, [data, searchText, statusFilter]);
  // View Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: DubaiConsultation | null;
  }>({ open: false, data: null });

  // -----------------------------------------------------------------
  // Fetch Data
  // -----------------------------------------------------------------
  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/admin/dubai-consultation`
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      const sorted = (result.data || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setData(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns = useMemo(() => [
  {
    name: "S. No.",
    selector: (_row: any, index?: number) =>
      index !== undefined ? index + 1 : 0,
    maxWidth: "50px",
  },
  {
    name: "Name",
    selector: (row: any) => row.name,
    minWidth: "170px",
  },
  {
    name: "Email",
    selector: (row: any) => row.email,
    minWidth: "200px",
  },
  {
    name: "Country Code",
    selector: (row: any) => row.countryCode,
    maxWidth: "100px",
  },
  {
    name: "WhatsApp",
    selector: (row: any) => row.whatsappNumber,
    maxWidth: "140px",
  },
  {
    name: "D.O.B",
    selector: (row: any) => moment(row.dob).format("DD/MM/YYYY"),
    maxWidth: "120px",
  },
  {
    name: "T.O.B",
selector: (row: any) =>
  moment(row.timeOfBirth, "HH:mm").format("hh:mm A"),
    maxWidth: "80px",
  },
  {
    name: "Place of Birth",
    selector: (row: any) => row.placeOfBirth,
    maxWidth: "140px",
  },
  {
    name: "Payment",
    selector: (row: any) => row.paymentStatus,
    maxWidth: "80px",
  },
  {
    name: "Concern",
    selector: (row: any) => row.concern,
    width: "200px",
  },
  {
    name: "Created Date",
    selector: (row: any) =>
      moment(row.createdAt).format("DD/MM/YYYY"),
    maxWidth: "120px",
  },
  {
    name: "Action",
    cell: (row: any) => (
      <div
        onClick={() => setViewModal({ open: true, data: row })}
        style={{ cursor: "pointer" }}
      >
        <ViewSvg />
      </div>
    ),
    maxWidth: "60px",
  },
], []);


  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      <div style={{ width: "100%", overflowX: "auto" }}>
        
       <MainDatatable
  columns={columns.map((col) => ({
    ...col,
    name: String(col.name),
    minwidth: col.width,
    width: undefined,
  }))}
  data={filteredData}
  isLoading={isLoading}
  title="Dubai Consultation Leads"
  url=""
  leftFilters={
    <select
      value={statusFilter}
      onChange={(e) =>
        setStatusFilter(e.target.value as "ALL" | "paid" | "unpaid")
      }
      className="border border-[#EF4444] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      <option value="ALL">All Status</option>
      <option value="paid">Paid</option>
      <option value="unpaid">Unpaid</option>
      <option value="pending">Pending</option>
    </select>
  }
/>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-medium"
                  style={{ color: Color.black }}
                >
                  Consultation Details
                </h2>
                <div
                  onClick={() =>
                    setViewModal({ open: false, data: null })
                  }
                  className="cursor-pointer"
                >
                  <CrossSvg />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <DetailRow label="Name" value={viewModal.data.name} />
                <DetailRow label="Email" value={viewModal.data.email} />
                <DetailRow
                  label="Country Code"
                  value={viewModal.data.countryCode}
                />
                <DetailRow
                  label="WhatsApp Number"
                  value={viewModal.data.whatsappNumber}
                />
                <DetailRow
                  label="Date of Birth"
                  value={moment(viewModal.data.dob).format("DD/MM/YYYY")}
                />
                <DetailRow
                  label="Time of Birth"
                  value={viewModal.data.timeOfBirth}
                />
                <DetailRow
                  label="Place of Birth"
                  value={viewModal.data.placeOfBirth}
                  
                />
                <DetailRow
                  label="Concern"
                  value={viewModal.data.concern}
                />
                <DetailRow
                  label="Payment Status"
                  value={viewModal.data.paymentStatus}
                />
                <DetailRow
                  label="Razorpay Order ID"
                  value={viewModal.data.razorpayOrderId}
                  
                />
                <DetailRow
                  label="Created At"
                  value={moment(viewModal.data.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                />
                <DetailRow
                  label="Updated At"
                  value={moment(viewModal.data.updatedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                />
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() =>
                    setViewModal({ open: false, data: null })
                  }
                  className="px-6 py-2 text-white rounded font-medium hover:opacity-90"
                  style={{ backgroundColor: Color.primary }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------
// Helper Component
// ---------------------------------------------------------------------
const DetailRow = ({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) => (
  <div className={fullWidth ? "" : "grid grid-cols-3 gap-4"}>
    <div className="font-semibold text-gray-700">{label}:</div>
    <div className={`text-gray-600 ${fullWidth ? "mt-1" : "col-span-2"}`}>
      {value || "-"}
    </div>
  </div>
);
