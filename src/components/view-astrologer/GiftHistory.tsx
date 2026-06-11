// app/astrologer/view-astrologer/components/gift-history.tsx
import React, { useEffect, useState } from "react";
import { IndianRupee } from "@/utils/common-function";
import MainDatatable from "@/components/common/MainDatatable";
import { TableColumn } from "react-data-table-component";
import { base_url, get_gift_history_by_astrologer_id } from "@/lib/api-routes";

interface GiftHistoryData {
  _id: string;
  astrologerId: {
    _id: string;
    astrologerName: string;
  };
  customerId: {
    _id: string;
    customerName: string;
  };
  totalPrice: number;
  adminPrice: number;
  partnerPrice: number;
}

interface GiftHistoryProps {
  astrologerId: string;
}

const GiftHistory: React.FC<GiftHistoryProps> = ({ astrologerId }) => {
  const [giftHistory, setGiftHistory] = useState<GiftHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns= [
    { 
      name: 'S.No.', 
      cell: (row:any, rowIndex?:number) => <div>{(rowIndex || 0) + 1}</div>,
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: GiftHistoryData) => row?.astrologerId?.astrologerName || '',
      sortable: true 
    },
    { 
      name: 'User', 
      selector: (row: GiftHistoryData) => row?.customerId?.customerName || '',
      sortable: true 
    },
    { 
      name: 'Total Price', 
      selector: (row: GiftHistoryData) => row?.totalPrice ? IndianRupee(parseFloat(row.totalPrice.toString()).toFixed(2)) : '' 
    },
    { 
      name: 'Admin Share', 
      selector: (row: GiftHistoryData) => row?.adminPrice ? IndianRupee(parseFloat(row.adminPrice.toString()).toFixed(2)) : '' 
    },
    { 
      name: 'Astro Share', 
      selector: (row: GiftHistoryData) => row?.partnerPrice ? IndianRupee(parseFloat(row.partnerPrice.toString()).toFixed(2)) : '' 
    },
  ];

  useEffect(() => {
    const fetchGiftHistory = async () => {
      if (!astrologerId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/${get_gift_history_by_astrologer_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setGiftHistory(data.results || data.data || data);
        }
      } catch (error) {
        console.error('Error fetching gift history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftHistory();
  }, [astrologerId]);

  return (
    <MainDatatable 
      data={giftHistory} 
      columns={columns} 
      isLoading={isLoading}
            url="/astrologer/view-astrologer"
title="Gift"
addButtonActive={false}
    />
  );
};

export default GiftHistory;