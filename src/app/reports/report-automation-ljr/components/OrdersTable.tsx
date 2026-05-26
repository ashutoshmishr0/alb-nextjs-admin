/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Order } from "../types";
import { ViewSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import { SendHorizonal, Mail, MailX, Loader2, Pencil, X } from "lucide-react";
import { EditSvg } from "../../../../../public/assets/svg";

interface Props {
  data: Order[];
  loading: boolean;
  page: number;
  limit: number;
  selectedIds: string[];
  onToggleRow: (orderId: string) => void;
  onToggleAll: () => void;
  onView: (row: Order) => void;
  onResendNotification: (orderId: string, lat: string, lon: string, place: string) => Promise<void>;
}

const SendDialog: React.FC<{
  order: Order;
  onClose: () => void;
  onSend: (orderId: string, lat: string, lon: string, place: string) => Promise<void>;
}> = ({ order, onClose, onSend }) => {
  const [place, setPlace] = useState(order.placeOfBirth || "");
  const [lat, setLat]     = useState(order.latitude || "");
  const [lon, setLon]     = useState(order.longitude || "");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["(cities)"] }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const selected = autocompleteRef.current?.getPlace();
      if (!selected?.geometry?.location) return;
      setPlace(selected.formatted_address || selected.name || "");
      setLat(selected.geometry.location.lat().toFixed(4));
      setLon(selected.geometry.location.lng().toFixed(4));
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    if (!place.trim() || !lat || !lon) return;
    setSending(true);
    try {
      await onSend(order._id!, lat, lon, place);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const isReady = place.trim() && lat && lon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Generate LJR Report</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Name</label>
            <input
              type="text"
              value={order.name || "—"}
              readOnly
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">WhatsApp</label>
            <input
              type="text"
              value={order.whatsapp || "—"}
              readOnly
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Place of Birth */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Place of Birth
              {order.placeOfBirth && (
                <span className="ml-1 text-gray-400 font-normal">(pre-filled from order)</span>
              )}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                // Clear lat/lon when user manually types — force dropdown selection
                setLat("");
                setLon("");
              }}
              placeholder="Search city..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              disabled={sending}
              autoFocus
            />

            {/* Lat/lon confirmed */}
            {lat && lon && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span>✓</span>
                <span>{lat}, {lon}</span>
              </p>
            )}

            {/* Warn if text present but no lat/lon */}
            {place && !lat && (
              <p className="text-xs text-amber-500 mt-1">
                Please select a city from the dropdown to confirm coordinates
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isReady || sending}
            className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
            ) : (
              <><SendHorizonal className="w-3.5 h-3.5" /> Generate</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export const OrdersTable: React.FC<Props> = ({
  data,
  loading,
  page,
  limit,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onView,
  onResendNotification,
}) => {
  const [dialogOrder, setDialogOrder] = useState<Order | null>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

const handleSend = async (orderId: string, lat: string, lon: string, place: string) => {
  setSendingIds((prev) => new Set(prev).add(orderId));
  try {
    await onResendNotification(orderId, lat, lon, place);
  } finally {
    setSendingIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }
};
  const columns = useMemo(() => {
    return [
      {
        name: "S.No.",
        selector: (_: Order, idx?: number) =>
          (page - 1) * limit + (idx || 0) + 1,
        width: "70px",
      },
      {
        name: "Plan",
        selector: (row: Order) => row?.planName || "—",
        width: "180px",
      },
      {
        name: "Amount",
        selector: (row: Order) => `₹${row?.amount?.split(" ")[0] || "0"}`,
        width: "100px",
      },
      {
        name: "Payment",
        cell: (row: Order) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              row?.status === "paid"
                ? "bg-green-100 text-green-700"
                : row?.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row?.status === "paid" ? "Paid" : row?.status || "—"}
          </span>
        ),
        width: "90px",
      },
      {
        name: "Report Status",
        cell: (row: Order) => {
          const isSending = sendingIds.has(row._id || "");
          if (isSending)
            return (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing
              </span>
            );

          const s = row?.reportDeliveryStatus;
          if (!s || s === "pending")
            return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
          if (s === "processing")
            return <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium">Processing</span>;
          if (s === "delivered")
            return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Delivered</span>;
          if (s === "failed")
            return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
          return <span className="text-gray-400 text-xs">—</span>;
        },
        width: "130px",
      },
      {
        name: "Email",
        cell: (row: Order) => {
          if (row?.emailDelivered === true)
            return (
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-700">Sent</span>
              </div>
            );
          if (row?.emailDelivered === false)
            return (
              <div className="flex items-center gap-1">
                <MailX className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600">Failed</span>
              </div>
            );
          return <span className="text-xs text-gray-400">Pending</span>;
        },
        width: "90px",
      },
      {
        name: "Name",
        selector: (row: Order) => row?.name || "—",
        width: "140px",
      },
      {
        name: "WhatsApp",
        selector: (row: Order) => row?.whatsapp || "—",
        width: "120px",
      },
      {
        name: "Language",
        selector: (row: Order) => row?.reportLanguage || "—",
        width: "90px",
      },
      {
        name: "Created",
        selector: (row: Order) =>
          row?.formattedCreatedAt ||
          (row?.createdAt
            ? moment(row.createdAt).format("DD/MM/YY hh:mm A")
            : "—"),
        width: "130px",
      },
      {
        name: "Actions",
        cell: (row: Order) => {
          const isSending = sendingIds.has(row._id || "");
          const isDelivered = row.reportDeliveryStatus === "delivered";

          return (
            <div className="flex items-center gap-2">
              {/* View */}
              <button
                onClick={() => onView(row)}
                className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
                title="View Details"
              >
                <ViewSvg />
              </button>

              {/* ✅ Pencil — sirf tab dikhao jab delivered nahi hai */}
              {!isDelivered && row._id && (
                <button
                  onClick={() => setDialogOrder(row)}
                  disabled={isSending}
                  className="p-1 hover:bg-yellow-50 rounded transition-colors shrink-0 disabled:opacity-40"
                  title="Send Report"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  ) : (
                    <EditSvg/>
                  )}
                </button>
              )}
            </div>
          );
        },
        width: "120px",
      },
    ];
  }, [page, limit, sendingIds, onView]);

  return (
    <>
      {dialogOrder && (
        <SendDialog
          order={dialogOrder}
          onClose={() => setDialogOrder(null)}
          onSend={async (orderId, lat, lon, place) => {
            await handleSend(orderId, lat, lon, place);
            setDialogOrder(null);
          }}
        />
      )}

      <div className="mb-4">
        {data.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            No orders found with the current filters.
          </div>
        ) : (
          <MainDatatable
            data={data}
            columns={columns.map((col) => ({
              ...col,
              minwidth: col.width,
              width: undefined,
            }))}
            isLoading={loading}
            showSearch={false}
          />
        )}
      </div>
    </>
  );
};