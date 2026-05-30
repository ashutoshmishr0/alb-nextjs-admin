"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import { CSVLink } from "react-csv";
import Swal from "sweetalert2";
import DataTable, { TableColumn } from "react-data-table-component";
import { DeepSearchSpace } from "@/utils/common-function";

import { Color } from "@/assets/colors";
import MainDatatable from "@/components/common/MainDatatable";
import {
  SwitchOnSvg,
  SwitchOffSvg,
  ViewSvg,
  EditSvg,
  WalletSvg,
  CrossSvg,
} from "@/components/svgs/page";
import { DocumentScanner, Report } from "@mui/icons-material";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Astrologer {
  _id: string;
  astrologerName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isVerified: boolean;
  chat_status?: "online" | "offline";
  call_status?: "online" | "offline";
  video_call_status?: "online" | "offline";
}

type AstrologerColumn = TableColumn<Astrologer>;

// CSV Row Type
interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

export default function AstrologerPage() {
  const router = useRouter();

  // State
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const filteredData = DeepSearchSpace(astrologers, searchText);

  // Wallet Modal
  const [walletModal, setWalletModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [inputFieldDetail, setInputFieldDetail] = useState<{
    amount: string;
    type: "credit" | "deduct" | "";
  }>({ amount: "", type: "" });
  const [inputFieldError, setInputFieldError] = useState<{
    amount?: string;
    type?: string;
  }>({});

  // Edit Status Modal
  const [editState, setEditState] = useState<{
    open: boolean;
    astro: Astrologer | null;
  }>({ open: false, astro: null });

  // -----------------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------------
  const fetchAstrologers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/get-all-astrologers`,{credentials: 'include'});
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const sorted = (data.astrologers || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAstrologers(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  // -----------------------------------------------------------------
  // CSV Data (Transformed for Export)
  // -----------------------------------------------------------------
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((astro, index) => ({
      "S.No.": index + 1,
      Name: astro.astrologerName,
      Email: astro.email,
      Mobile: astro.phoneNumber,
      "Created Date": moment(astro.createdAt).format("DD/MM/YYYY"),
      Status: astro.isVerified ? "Verified" : "Unverified",
    }));
  }, [filteredData]);

  // -----------------------------------------------------------------
  // Wallet Handlers
  // -----------------------------------------------------------------
  const openWallet = (astro: Astrologer) => {
    setUserId(astro._id);
    setWalletModal(true);
  };

  const closeWallet = () => {
    setWalletModal(false);
    setInputFieldDetail({ amount: "", type: "" });
    setInputFieldError({});
  };

  const handleInputFieldError = (
    field: "amount" | "type",
    msg: string | null
  ) => {
    setInputFieldError((prev) => ({ ...prev, [field]: msg ?? undefined }));
  };

  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "type") {
      setInputFieldDetail((prev) => ({
        ...prev,
        type: value as "credit" | "deduct",
      }));
    }
  };

  const validateWallet = () => {
    let ok = true;
    const { amount, type } = inputFieldDetail;

    if (!amount) {
      handleInputFieldError("amount", "Please Enter Amount");
      ok = false;
    } else if (Number(amount) <= 0) {
      handleInputFieldError("amount", "Please Enter Amount Greater Than Zero");
      ok = false;
    } else {
      handleInputFieldError("amount", null);
    }

    if (!type) {
      handleInputFieldError("type", "Please Select Type");
      ok = false;
    } else {
      handleInputFieldError("type", null);
    }
    return ok;
  };

  const submitWallet = async () => {
    if (!validateWallet()) return;

    const payload = {
      transactions: [
        { astrologerId: userId, amount: Number(inputFieldDetail.amount) },
      ],
      type: inputFieldDetail.type,
    };

    try {
      const res = await fetch("/api/astrologers/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchAstrologers();
      closeWallet();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleVerify = async (astro: Astrologer) => {
    const result = await Swal.fire({
      title: "Change Verification Status?",
      text: `Are you sure you want to ${
        astro.isVerified ? "unverify" : "verify"
      } ${astro.astrologerName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, change it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      // Show loading
      Swal.fire({
        title: "Updating...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/verify-astrologer-profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            astrologerId: astro._id,
            isVerified: !astro.isVerified,
          }),
        }
      );

      await fetchAstrologers();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Astrologer ${
          !astro.isVerified ? "verified" : "unverified"
        } successfully`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update verification status",
      });
    }
  };

  const openEdit = (astro: Astrologer) => setEditState({ open: true, astro });
  const closeEdit = () => setEditState({ open: false, astro: null });

  // -----------------------------------------------------------------
  // Change Status with Swal
  // -----------------------------------------------------------------
const changeStatus = async (
  field: "chat_status" | "call_status" | "video_call_status",
  id: string,
  current: string | undefined
) => {
  const newVal = current === "online" ? "offline" : "online";
  const fieldName = field.replace("_status", "").replace("_", " ");

  const result = await Swal.fire({
    title: `Change ${fieldName} status?`,
    text: `Set ${fieldName} to ${newVal}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: `Yes, set to ${newVal}`,
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({
      title: "Updating Status...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Dynamically determine the endpoint based on the field
    const endpointMap = {
      chat_status: "/api/astrologer/change-chat-status",
      call_status: "/api/astrologer/change-call-status",
      video_call_status: "/api/astrologer/change-video-call-status",
    };

    const endpoint = endpointMap[field];

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ astrologerId: id, [field]: newVal }),
    });

    await fetchAstrologers();
    closeEdit();

    Swal.fire({
      icon: "success",
      title: "Status Updated!",
      text: `${fieldName} set to ${newVal}`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (e) {
    console.error(e);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to update status",
    });
  }
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
        width: "40px",
      },
      {
        name: "Name",
        selector: (row: any) => row.astrologerName,
        width: "180px",
      },
      { name: "Email", selector: (row: any) => row.email, width: "250px" },
      {
        name: "Mobile",
        selector: (row: any) => row.phoneNumber || "N/A",
        width: "150px",
      },
      {
        name: "Created Date",
        selector: (row: any) => moment(row.createdAt).format("DD/MM/YYYY"),
        width: "140px",
      },
      {
        name: "Status",
        cell: (row: any) => (
          <div style={{ cursor: "pointer" }} onClick={() => toggleVerify(row)}>
            {row.isVerified ? <SwitchOnSvg /> : <SwitchOffSvg />}
          </div>
        ),
        width: "140px",
        center: true,
      },
      {
        name: "Action",
        cell: (row) => (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              onClick={() => {
                sessionStorage.setItem(
                  "selectedAstrologer",
                  JSON.stringify(row)
                );
                router.push("/astrologer/view-astrologer");
              }}
              style={{ cursor: "pointer" }}
            >
              <ViewSvg />
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/astrologer/edit-astrologer?id=${row._id}`);
              }}
              style={{ cursor: "pointer" }}
            >
              <EditSvg />
            </div>
            
            <div
              onClick={() => openEdit(row)}
              style={{ cursor: "pointer" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </div>
          </div>
        ),
        width: "150px",
        center: true,
      },
    ],
    [router]
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
          title="List of Astrologers"
          url="/astrologer/add-astrologer"
        />
      </div>

      {/* Wallet Modal */}
      {walletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium" style={{ color: Color.black }}>
                  Wallet
                </h2>
                <div onClick={closeWallet} className="cursor-pointer">
                  <CrossSvg />
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label htmlFor="amount" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Amount <span className="text-red-600">*</span>
                </label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={inputFieldDetail.amount}
                  onChange={handleInputField}
                  onFocus={() => handleInputFieldError("amount", null)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    inputFieldError.amount ? "border-red-600" : "border-gray-300"
                  }`}
                />
                {inputFieldError.amount && (
                  <p className="text-red-600 text-xs mt-1">
                    {inputFieldError.amount}
                  </p>
                )}
              </div>

              {/* Type Select */}
              <div className="mb-6">
                <label htmlFor="type" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={inputFieldDetail.type}
                  onChange={handleSelectChange}
                  onFocus={() => handleInputFieldError("type", null)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    inputFieldError.type ? "border-red-600" : "border-gray-300"
                  }`}
                >
                  <option value="" disabled>
                    ---Select Type---
                  </option>
                  <option value="credit">Add</option>
                  <option value="deduct">Deduct</option>
                </select>
                {inputFieldError.type && (
                  <p className="text-red-600 text-xs mt-1">
                    {inputFieldError.type}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={submitWallet}
                  className="px-6 py-2 text-white rounded font-medium hover:opacity-90"
                  style={{ backgroundColor: Color.primary }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editState.open && editState.astro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editState.astro.astrologerName}
                </h2>
                <button
                  onClick={closeEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Status Buttons */}
              <div className="space-y-4">
                {(
                  ["chat_status", "call_status", "video_call_status"] as const
                ).map((field) => {
                  const status = editState.astro![field];
                  const label =
                    field === "chat_status"
                      ? "Change Chat Status"
                      : field === "call_status"
                      ? "Change Call Status"
                      : "Change Video Call Status";

                  return (
                    <div key={field} className="grid grid-cols-5 gap-4 items-center">
                      <div className="col-span-2 text-sm font-medium">
                        {label}
                      </div>
                      <div className="col-span-3">
                        <button
                          onClick={() =>
                            changeStatus(field, editState.astro!._id, status)
                          }
                          className={`w-full px-4 py-2 rounded text-white font-medium ${
                            status === "online"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {status === "online"
                            ? `Set ${field.replace("_status", "")} Offline`
                            : `Set ${field.replace("_status", "")} Online`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}