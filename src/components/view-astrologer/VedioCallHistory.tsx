// app/astrologer/view-astrologer/components/video-call-history.tsx
import React, { useEffect, useState } from "react";
import moment from "moment";
import { IndianRupee, secondsToHMS } from "@/utils/common-function";
import MainDatatable from "@/components/common/MainDatatable";

interface VideoCallHistoryData {
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

interface VideoCallHistoryProps {
  astrologerId: string;
}

const VideoCallHistory: React.FC<VideoCallHistoryProps> = ({ astrologerId }) => {
  const [videoCallHistory, setVideoCallHistory] = useState<VideoCallHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns = [
    { 
      name: 'S.No.', 
      cell: (row:any, rowIndex?:number) => <div>{(rowIndex || 0) + 1}</div>,
      width: '80px' 
    },
    { 
      name: 'Astrologer', 
      selector: (row: VideoCallHistoryData) => row?.astrologerId?.astrologerName || '',
      sortable: true 
    },
    { 
      name: 'Customers', 
      selector: (row: VideoCallHistoryData) => row?.customerId?.customerName || '',
      sortable: true 
    },
    { 
      name: 'Total Price', 
      selector: (row: VideoCallHistoryData) => row?.totalPrice ? IndianRupee(row.totalPrice) : '' 
    },
    { 
      name: 'Admin Share', 
      selector: (row: VideoCallHistoryData) => row?.adminPrice ? IndianRupee(row.adminPrice) : '' 
    },
    { 
      name: 'Astrologer Share', 
      selector: (row: VideoCallHistoryData) => row?.partnerPrice ? IndianRupee(row.partnerPrice) : '' 
    },
    { 
      name: 'Duration', 
      selector: (row: VideoCallHistoryData) => row?.duration ? secondsToHMS(row.duration) : '' 
    },
    { 
      name: 'Start Time', 
      selector: (row: VideoCallHistoryData) => row?.startTime ? moment(row.startTime).format('hh:mm:ss a') : '' 
    },
    { 
      name: 'End Time', 
      selector: (row: VideoCallHistoryData) => row?.endTime ? moment(Number(row.endTime)).format('hh:mm:ss a') : '' 
    },
    { 
      name: 'Date', 
      selector: (row: VideoCallHistoryData) => row?.createdAt ? moment(row.createdAt).format('DD MMMM YYYY') : '', 
      width: "180px" 
    },
  ];

  useEffect(() => {
    const fetchVideoCallHistory = async () => {
      if (!astrologerId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/astrologer_chat_history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId,
            type: 'VideoCall'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setVideoCallHistory(data.videoCallHistory || data.data || data);
        }
      } catch (error) {
        console.error('Error fetching video call history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoCallHistory();
  }, [astrologerId]);

  return (
    <MainDatatable 
      data={videoCallHistory} 
      columns={columns} 
            url="/astrologer/view-astrologer"
title="Video Call"
addButtonActive={false}
      isLoading={isLoading}
    />
  );
};

export default VideoCallHistory;