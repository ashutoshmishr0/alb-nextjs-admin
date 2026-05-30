"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Save, Edit2 } from "lucide-react";
import { SwitchOnSvg, SwitchOffSvg } from "@/components/svgs/page";

interface GlobalOfferPrice {
  _id?: string;
  OfferPrice: number;
}

interface Astrologer {
  _id: string;
  astrologerName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isVerified: boolean;
  // pricing flags
  useGlobalFirstTimeOfferPrice?: boolean;
  GoWithCustomPricings?: boolean;
}

export default function GlobalOfferPricePage() {
  const [globalOfferPrice, setGlobalOfferPrice] =
    useState<GlobalOfferPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // table state
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [astroLoading, setAstroLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Fetch current global offer price
  const fetchGlobalOfferPrice = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-offer-price`
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      if (data.success && data.data) {
        setGlobalOfferPrice(data.data);
        setPriceInput(data.data.OfferPrice.toString());
      }
    } catch (e) {
      console.error("Error fetching global offer price:", e);
      toast.error("Failed to load global offer price");
    } finally {
      setLoading(false);
    }
  };

  // Fetch astrologers list
  const fetchAstrologers = async () => {
    try {
      setAstroLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/get-all-astrologers`,{credentials: 'include'}
      );
      if (!res.ok) throw new Error("Failed to fetch astrologers");

      const data = await res.json();

      const list: Astrologer[] = (data.astrologers || []).map((a: any) => ({
        _id: a._id,
        astrologerName: a.astrologerName,
        email: a.email,
        phoneNumber: a.phoneNumber,
        createdAt: a.createdAt,
        isVerified: a.isVerified,
        useGlobalFirstTimeOfferPrice: a.useGlobalFirstTimeOfferPrice ?? false,
        GoWithCustomPricings: a.GoWithCustomPricings ?? false,
      }));

      setAstrologers(list);
    } catch (e) {
      console.error("Error fetching astrologers:", e);
      toast.error("Failed to load astrologers");
    } finally {
      setAstroLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalOfferPrice();
    fetchAstrologers();
  }, []);

  // Validate Price Input
  const validatePrice = () => {
    const price = Number(priceInput);

    if (!priceInput) {
      setPriceError("Please enter a price");
      return false;
    }

    if (isNaN(price) || price <= 0) {
      setPriceError("Please enter a valid price greater than 0");
      return false;
    }

    setPriceError("");
    return true;
  };

  // Submit Price
  const submitPrice = async () => {
    if (!validatePrice()) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/offer-price`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            OfferPrice: Number(priceInput),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update");

      const data = await res.json();

      if (data.success) {
        await fetchGlobalOfferPrice();
        setIsEditing(false);
        toast.success(`Global offer price updated to ₹${priceInput}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update global offer price");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPriceInput(globalOfferPrice?.OfferPrice.toString() || "");
    setPriceError("");
  };

  // simple client-side filter
  const filteredAstrologers = useMemo(() => {
    if (!searchText) return astrologers;
    const q = searchText.toLowerCase();
    return astrologers.filter(
      (a) =>
        a.astrologerName.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phoneNumber?.toLowerCase().includes(q)
    );
  }, [astrologers, searchText]);

  // Toggle handler with correct pricingMode API
  const handleToggleGlobalPricing = async (id: string) => {
    const target = astrologers.find((a) => a._id === id);
    if (!target) return;

    // if currently true -> turn off (pricingMode = "none" -> base price)
    // if currently false -> turn on global pricing
    const nextValue = !target.useGlobalFirstTimeOfferPrice;
    const pricingMode: "global" | "none" = nextValue ? "global" : "none";

    // Optimistic UI update
    setAstrologers((prev) =>
      prev.map((a) =>
        a._id === id
          ? {
              ...a,
              useGlobalFirstTimeOfferPrice: pricingMode === "global",
              GoWithCustomPricings: false, // this page never sets custom mode
            }
          : a
      )
    );

    try {
      const payload: any = {
        useGlobalFirstTimeOfferPrice: pricingMode === "global",
        GoWithCustomPricings: false, // this page never sets custom mode
      };

      // if switching to global, clear any custom first-time prices
      if (pricingMode === "global") {
        payload.firstTimeOfferPrices = [];
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/update-first-time-offer/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update");

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update");
      }

      toast.success(
        pricingMode === "global"
          ? "Global first-time pricing enabled for this astrologer"
          : "Global first-time pricing disabled (base price will be used)"
      );
    } catch (e: any) {
      console.error("Error toggling global pricing:", e);

      // Revert on error
      setAstrologers((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                useGlobalFirstTimeOfferPrice:
                  target.useGlobalFirstTimeOfferPrice ?? false,
                GoWithCustomPricings: target.GoWithCustomPricings ?? false,
              }
            : a
        )
      );

      toast.error(
        e?.message || "Failed to update global pricing for astrologer"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Customer First-Time Consultation Price
            </h2>
            <p className="text-sm text-gray-600">
              Platform-wide offer price for new customers (15 min consultations)
            </p>
          </div>

          {/* Global price edit inline on header */}
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Current Global Price</p>
                  <p className="text-lg font-bold text-red-600">
                    ₹{globalOfferPrice?.OfferPrice ?? "Not Set"}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Global Offer Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-600 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        setPriceError("");
                      }}
                      className={`w-32 pl-7 pr-3 py-1.5 border-2 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        priceError ? "border-red-600" : "border-gray-300"
                      }`}
                      placeholder="Price"
                      min="0"
                    />
                  </div>
                  {priceError && (
                    <p className="text-red-600 text-xs mt-1">{priceError}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-5">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 border-2 border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPrice}
                    disabled={submitting}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-xs font-medium"
                  >
                    {submitting ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{submitting ? "Saving" : "Save"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Astrologers table section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mt-4">
            <h3 className="text-base font-semibold text-gray-900">
              Astrologers using Global Pricing
            </h3>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, mobile..."
              className="w-64 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[480px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      S. No.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Mobile
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">
                      Use Global Pricing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {astroLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-gray-500 text-sm"
                      >
                        Loading astrologers...
                      </td>
                    </tr>
                  ) : filteredAstrologers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-gray-500 text-sm"
                      >
                        No astrologers found.
                      </td>
                    </tr>
                  ) : (
                    filteredAstrologers.map((astro, index) => (
                      <tr
                        key={astro._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-900">
                          {astro.astrologerName}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {astro.email || "N/A"}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {astro.phoneNumber || "N/A"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleGlobalPricing(astro._id)
                            }
                            className="inline-flex items-center justify-center"
                          >
                            {astro.useGlobalFirstTimeOfferPrice ? (
                              <SwitchOnSvg />
                            ) : (
                              <SwitchOffSvg />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Toggle “Use Global Pricing” to indicate which astrologers should use
            the platform-wide first-time offer price. When turned off, the
            astrologer will fall back to their base consultation price.
          </p>
        </div>
      </div>
    </div>
  );
}
