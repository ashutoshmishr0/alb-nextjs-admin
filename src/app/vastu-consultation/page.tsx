"use client";

import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { DeepSearchSpace } from "@/utils/common-function";
import { Color } from "@/assets/colors";

import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, CrossSvg } from "@/components/svgs/page";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface PropertyLead {
  _id: string;
  propertyName: string;
  propertyType: string;
  city: string;
  longitude: string;
  latitude: string;
  phoneNo: string;
  countryCode: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export default function PropertyLeadsPage() {
  const [data, setData] = useState<PropertyLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "residential" | "commercial" | "plot">("ALL");

  const filteredData = useMemo(() => {
    let tempData = DeepSearchSpace(data, searchText);

    if (typeFilter !== "ALL") {
      tempData = tempData.filter(
        (item: any) =>
          item.propertyType?.toLowerCase() === typeFilter
      );
    }

    return tempData;
  }, [data, searchText, typeFilter]);

  // View Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: PropertyLead | null;
  }>({ open: false, data: null });

  // -----------------------------------------------------------------
  // Fetch Data
  // -----------------------------------------------------------------
  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/admin/property_data`
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      const sorted = (result.properties || []).sort(
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
    fetchProperties();
  }, []);

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns = useMemo(() => [
    {
      name: "S. No.",
      selector: (_row: any, index?: number) =>
        index !== undefined ? index + 1 : 0,
      maxwidth: "50px",
    },
    {
      name: "Property Name",
      selector: (row: any) => row.propertyName,
      minwidth: "170px",
    },
    {
      name: "Property Type",
      selector: (row: any) => row.propertyType,
      maxwidth: "130px",
    },
    {
      name: "City",
      selector: (row: any) => row.city,
      maxwidth: "120px",
    },
    {
      name: "Country Code",
      selector: (row: any) => row.countryCode,
      maxwidth: "110px",
    },
    {
      name: "Phone No.",
      selector: (row: any) => row.phoneNo,
      maxwidth: "140px",
    },
    {
      name: "Message",
      selector: (row: any) => row.message,
      width: "200px",
    },
    {
      name: "Created Date",
      selector: (row: any) =>
        moment(row.createdAt).format("DD/MM/YYYY"),
      maxwidth: "120px",
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
      maxwidth: "60px",
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
          title="Vastu Consultation"
          url=""
          leftFilters={
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "ALL" | "residential" | "commercial" | "plot")
              }
              className="border border-[#EF4444] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot</option>
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
                  Vastu Consultation Details
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
                <DetailRow label="Property Name" value={viewModal.data.propertyName} />
                <DetailRow label="Property Type" value={viewModal.data.propertyType} />
                <DetailRow label="City" value={viewModal.data.city} />
                <DetailRow label="Country Code" value={viewModal.data.countryCode} />
                <DetailRow label="Phone No." value={viewModal.data.phoneNo} />
                {/* <DetailRow label="Longitude" value={viewModal.data.longitude} /> */}
                {/* <DetailRow label="Latitude" value={viewModal.data.latitude} /> */}
                <DetailRow label="Message" value={viewModal.data.message} />
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