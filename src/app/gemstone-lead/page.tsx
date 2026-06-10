"use client";

import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { CSVLink } from "react-csv";
import { DeepSearchSpace } from "@/utils/common-function";

import { Color } from "@/assets/colors";
import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, CrossSvg } from "@/components/svgs/page";
import { TableColumn } from "react-data-table-component";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface ContactEnquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  productName: string;
  productType: string;
  productDetails: string;
  createdAt: string;
  updatedAt: string;
}

type EnquiryColumn = TableColumn<ContactEnquiry>;

// CSV Row Type
interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

export default function ContactEnquiryPage() {
  // State
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const filteredData = DeepSearchSpace(enquiries, searchText);

  // View Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: ContactEnquiry | null;
  }>({ open: false, data: null });

  // -----------------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------------
  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/admin/leads`
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      const sorted = (result.data || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setEnquiries(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // -----------------------------------------------------------------
  // CSV Data (Transformed for Export)
  // -----------------------------------------------------------------
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((enquiry, index) => ({
      "S.No.": index + 1,
      Name: enquiry.name,
      Email: enquiry.email,
      Phone: enquiry.phone,
      Message: enquiry.message,
      "Product Name": enquiry.productName || "",
      "Product Type": enquiry.productType || "",
      "Created Date": moment(enquiry.createdAt).format("DD/MM/YYYY"),
    }));
  }, [filteredData]);

  // -----------------------------------------------------------------
  // View Modal Handlers
  // -----------------------------------------------------------------
  const openViewModal = (enquiry: ContactEnquiry) => {
    setViewModal({ open: true, data: enquiry });
  };

  const closeViewModal = () => {
    setViewModal({ open: false, data: null });
  };

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        name: "S. No.",
        selector: (_row: any, index?: number) =>
          index !== undefined ? index + 1 : 0,
        width: "80px",
      },
      {
        name: "Name",
        selector: (row: any) => row.name,
        width: "180px",
      },
      {
        name: "Email",
        selector: (row: any) => row.email,
        width: "250px",
      },
      {
        name: "Phone",
        selector: (row: any) => row.phone,
        width: "150px",
      },
      {
        name: "Message",
        selector: (row: any) => row.message,
        width: "250px",
        cell: (row: any) => (
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={row.message}
          >
            {row.message}
          </div>
        ),
      },
      {
        name: "Product Name",
        selector: (row: any) => row.productName || "",
        width: "180px",
      },
      {
        name: "Product Type",
        selector: (row: any) => row.productType || "",
        width: "150px",
      },
      {
        name: "Created Date",
        selector: (row: any) => moment(row.createdAt).format("DD/MM/YYYY"),
        width: "140px",
      },
      {
        name: "Action",
        cell: (row: any) => (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              onClick={() => openViewModal(row)}
              style={{ cursor: "pointer" }}
            >
              <ViewSvg />
            </div>
          </div>
        ),
        width: "100px",
        // center: true,
      },
    ],
    []
  );

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <MainDatatable
          columns={columns.map((col) => ({
            ...col,
            minwidth: col.width,
            width: undefined,
          }))}
          data={filteredData}
          isLoading={isLoading}
          title="Gemstone Leads"
          url=""
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
                  Enquiry Details
                </h2>
                <div onClick={closeViewModal} className="cursor-pointer">
                  <CrossSvg />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <DetailRow label="Name" value={viewModal.data.name} />
                <DetailRow label="Email" value={viewModal.data.email} />
                <DetailRow label="Phone" value={viewModal.data.phone} />
                <DetailRow
                  label="Message"
                  value={viewModal.data.message}
                  fullWidth
                />
                <DetailRow
                  label="Product Name"
                  value={viewModal.data.productName || ""}
                />
                <DetailRow
                  label="Product Type"
                  value={viewModal.data.productType || ""}
                />
                <DetailRow
                  label="Product Details"
                  value={viewModal.data.productDetails || ""}
                  fullWidth
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
                  onClick={closeViewModal}
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

// Helper Component for Detail Rows
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
      {value}
    </div>
  </div>
);