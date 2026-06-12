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
  goWithFirstFreePriceMobile?: boolean;
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
        `/api/admin/get-all-astrologers`,
        { credentials: "include" }
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
        goWithFirstFreePriceMobile: a.goWithFirstFreePriceMobile ?? false,
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

  // Toggle handler for mobile first-free price
  const handleToggleMobileFirstFree = async (id: string) => {
    const target = astrologers.find((a) => a._id === id);
    if (!target) return;

    const nextValue = !target.goWithFirstFreePriceMobile;

    // Optimistic UI update
    setAstrologers((prev) =>
      prev.map((a) =>
        a._id === id ? { ...a, goWithFirstFreePriceMobile: nextValue } : a
      )
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/toggle-mobile-first-free/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goWithFirstFreePriceMobile: nextValue,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update");

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update");
      }

      toast.success(
        nextValue
          ? "Mobile first free price enabled for this astrologer"
          : "Mobile first free price disabled for this astrologer"
      );
    } catch (e: any) {
      console.error("Error toggling mobile first free price:", e);

      // Revert on error
      setAstrologers((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                goWithFirstFreePriceMobile:
                  target.goWithFirstFreePriceMobile ?? false,
              }
            : a
        )
      );

      toast.error(
        e?.message || "Failed to update mobile first free price for astrologer"
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
      <div className=" mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              First 15 Min Free Mobile Consultation
            </h2>
            <p className="text-sm text-gray-600">
              Platform-wide offer for new customers on askbandhu (15 min consultations)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, mobile..."
              className="w-64 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Astrologers table section */}
        <div className="space-y-4">

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className=" overflow-auto">
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
                      Use Free Offer
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
                              handleToggleMobileFirstFree(astro._id)
                            }
                            className="inline-flex items-center justify-center"
                          >
                            {astro.goWithFirstFreePriceMobile ? (
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
        </div>
      </div>
    </div>
  );
}