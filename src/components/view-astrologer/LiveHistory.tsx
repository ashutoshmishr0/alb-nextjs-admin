// app/astrologer/view-astrologer/components/live-history.tsx
import React, { useEffect, useState } from "react";
import moment from "moment";
import { IndianRupee, secondsToHMS } from "@/utils/common-function";
import MainDatatable from "@/components/common/MainDatatable";
import { TableColumn } from "react-data-table-component";
import { base_url, get_live_history_by_astrologer_id } from "@/lib/api-routes";

interface LiveHistoryData {
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
  duration: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface LiveHistoryProps {
  astrologerId: string;
}

const LiveHistory: React.FC<LiveHistoryProps> = ({ astrologerId }) => {
  const [liveHistory, setLiveHistory] = useState<LiveHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns= [
    { 
      name: 'S.No.', 
      cell: (row:any, rowIndex?:number) => <div>{(rowIndex || 0) + 1}</div>,
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: LiveHistoryData) => row?.astrologerId?.astrologerName || '',
      sortable: true 
    },
    { 
      name: 'Customers', 
      selector: (row: LiveHistoryData) => row?.customerId?.customerName || '',
      sortable: true 
    },
    { 
      name: 'Total Price', 
      selector: (row: LiveHistoryData) => row?.totalPrice ? IndianRupee(row.totalPrice) : '' 
    },
    { 
      name: 'Admin Share', 
      selector: (row: LiveHistoryData) => row?.adminPrice ? IndianRupee(row.adminPrice) : '' 
    },
    { 
      name: 'Astrologer Share', 
      selector: (row: LiveHistoryData) => row?.partnerPrice ? IndianRupee(row.partnerPrice) : '' 
    },
    { 
      name: 'Duration', 
      selector: (row: LiveHistoryData) => row?.duration ? secondsToHMS(row.duration) : '' 
    },
    { 
      name: 'Start Time', 
      selector: (row: LiveHistoryData) => row?.startTime ? moment(row.startTime).format('hh:mm:ss a') : '' 
    },
    { 
      name: 'End Time', 
      selector: (row: LiveHistoryData) => row?.endTime ? moment(Number(row.endTime)).format('hh:mm:ss a') : '' 
    },
    { 
      name: 'Date', 
      selector: (row: LiveHistoryData) => row?.createdAt ? moment(row.createdAt).format('DD MMMM YYYY') : '', 
      width: "180px" 
    },
  ];

  useEffect(() => {
    const fetchLiveHistory = async () => {
      if (!astrologerId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/${get_live_history_by_astrologer_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId,
            type: 'live_video_call'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setLiveHistory(data.liveHistory || data.data || data);
        }
      } catch (error) {
        console.error('Error fetching live history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveHistory();
  }, [astrologerId]);

  return (
    <MainDatatable 
      data={liveHistory} 
      columns={columns} 
            url="/astrologer/view-astrologer"
title="Live"
addButtonActive={false}
      isLoading={isLoading}
    />
  );
};

export default LiveHistory;