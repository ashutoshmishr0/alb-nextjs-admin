'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import { Reorder } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────
interface ReorderPuja {
  _id: string;
  title: string;
  subTitle?: string;
  overview?: string;
  price: number;
  mainImage: string;
  laptopImage?: string;
  mobileImage?: string;
  sortOrder: number;
  status: string;
}

const formatIndianRupee = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// ── Drag Handle SVG ──────────────────────────────────────────────────────
const DragHandleSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L9 18M15 6L15 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── API helpers ───────────────────────────────────────────────────────────
const getReorderList = async (): Promise<ReorderPuja[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/reorder-list`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch puja reorder list");
  const data = await res.json();
  return data.pujas || [];
};

const saveOrder = async (orders: { id: string; sortOrder: number }[]) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/orders/bulk`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orders }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to save order");
  return data;
};

// ── Row ───────────────────────────────────────────────────────────────────
interface RowProps {
  puja: ReorderPuja;
  index: number;
}

const PujaRow: React.FC<RowProps> = ({ puja, index }) => {
  return (
    <Reorder.Item
      value={puja}
      id={puja._id}
      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-4 shadow-sm cursor-grab active:cursor-grabbing"
      whileDrag={{ boxShadow: "0 8px 20px rgba(0,0,0,0.12)", scale: 1.01 }}
    >
      {/* Handle is now just a visual affordance — the whole row is draggable */}
      <div className="flex-shrink-0 pointer-events-none">
        <DragHandleSvg />
      </div>

      <div className="w-8 text-center flex-shrink-0">
        <span className="text-base font-bold text-blue-600">#{index + 1}</span>
      </div>

      {/* Image thumbnails — main / laptop / mobile.
          pointer-events-none stops the natively-draggable <img> tags from
          hijacking the row's drag gesture. */}
      <div className="flex gap-1.5 flex-shrink-0 pointer-events-none">
        {[
        //   { src: puja.mainImage, label: "Main" },
        //   { src: puja.laptopImage, label: "Laptop" },
          { src: puja.mobileImage, label: "Mobile" },
        ].map(({ src, label }) =>
          src ? (
            <div key={label} className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100" title={label}>
              <Image
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL3}${src}`}
                alt={`${puja.title} ${label}`}
                fill
                draggable={false}
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div
              key={label}
              className="w-10 h-10 rounded-md bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center"
              title={`No ${label.toLowerCase()} image`}
            >
              <span className="text-[8px] text-gray-300">—</span>
            </div>
          )
        )}
      </div>

      <div className="flex-1 min-w-0 pointer-events-none select-none">
        <h3 className="font-medium text-gray-900 text-sm truncate">{puja.title}</h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {puja.overview || "No description"}
        </p>
      </div>

      <span className="text-sm font-semibold text-gray-700 flex-shrink-0 pointer-events-none select-none">
        {formatIndianRupee(puja.price)}
      </span>
    </Reorder.Item>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────
const ReorderPujaPage: React.FC = () => {
  const router = useRouter();
  const [pujas, setPujas] = useState<ReorderPuja[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getReorderList();
      setPujas(data);
      setOriginalOrder(data.map(p => p._id));
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const isDirty = pujas.some((p, i) => p._id !== originalOrder[i]);

  const handleSave = async () => {
    const orders = pujas.map((p, index) => ({ id: p._id, sortOrder: index + 1 }));

    const confirm = await Swal.fire({
      title: "Save new order?",
      text: `This will update the display order for ${orders.length} puja(s) across the website.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, save order",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      await saveOrder(orders);
      setOriginalOrder(pujas.map(p => p._id));
      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Puja order updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchList(); // simplest way to restore server-saved order
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className=" mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reorder Pujas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag using the handle on the left to change the order pujas appear on the website.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      {pujas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No pujas found.</div>
      ) : (
        <Reorder.Group
          axis="y"
          values={pujas}
          onReorder={setPujas}
          className="space-y-2 mt-6"
        >
          {pujas.map((puja, index) => (
            <PujaRow key={puja._id} puja={puja} index={index} />
          ))}
        </Reorder.Group>
      )}

      {/* Footer actions */}
      <div className="flex justify-end gap-3 mt-6 sticky bottom-4">
        <button
          onClick={handleReset}
          disabled={!isDirty || saving}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? "Saving..." : "Save Order"}
        </button>
      </div>
    </div>
  );
};

export default ReorderPujaPage;