// 'use client';

// import React, { useEffect, useState, useMemo } from 'react';
// import moment from 'moment';
// import MainDatatable from '@/components/common/MainDatatable';
// import DatatableHeading from '@/components/datatable/DatatableHeading';
// import { TableColumn } from 'react-data-table-component';
// import { base_url } from '@/lib/api-routes';

// // ---------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------
// interface Astrologer {
//   _id: string;
//   astrologerName: string;
// }

// interface LeaveRequest {
//   _id: string;
//   astrologerId: Astrologer;
//   startDate: string;
//   startTime: string;
//   endDate: string;
//   endTime: string;
//   status: 'pending' | 'approved' | 'rejected';
// }

// interface CSVRow {
//   [key: string]: string | number | boolean | undefined;
// }

// // ---------------------------------------------------------------------
// // Utility: Deep Search
// // ---------------------------------------------------------------------
// const deepSearch = <T,>(data: T[], searchText: string): T[] => {
//   if (!searchText) return data;
//   const lowerSearch = searchText.toLowerCase();
//   return data.filter((item) =>
//     JSON.stringify(item).toLowerCase().includes(lowerSearch)
//   );
// };

// // ---------------------------------------------------------------------
// // Component
// // ---------------------------------------------------------------------
// const LeaveRequestPage: React.FC = () => {
//   const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
//   const [filteredData, setFilteredData] = useState<LeaveRequest[]>([]);
//   const [searchText, setSearchText] = useState('');
//   const [loading, setLoading] = useState(true);

//   // ✅ Fetch data
//   const fetchLeaveRequests = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`/api/admin/get_all_leave_requests`); // change path if needed
//       const data = await res.json();
//       setLeaveRequests(data.leaves);
//       setFilteredData(data.leaves);
//     } catch (err) {
//       console.error('Error fetching leave requests:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Update status
//   const handleStatusChange = async (id: string, status: LeaveRequest['status']) => {
//     try {
//       await fetch(`/api/astrologer/leave-request/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ status }),
//       });
//       setLeaveRequests((prev) =>
//         prev.map((req) =>
//           req._id === id ? { ...req, status } : req
//         )
//       );
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };

//   // ✅ Search filtering
//   useEffect(() => {
//     setFilteredData(deepSearch(leaveRequests, searchText));
//   }, [searchText, leaveRequests]);

//   useEffect(() => {
//     fetchLeaveRequests();
//   }, []);

//   // ✅ CSV Data (Transformed for Export)
//   const csvData: CSVRow[] = useMemo(() => {
//     return filteredData.map((req, index) => ({
//       'S.No.': index + 1,
//       'Astrologer': req?.astrologerId?.astrologerName || '-',
//       'Start Date': moment(req.startDate).format('DD-MMM-YYYY'),
//       'Start Time': req.startTime,
//       'End Date': moment(req.endDate).format('DD-MMM-YYYY'),
//       'End Time': req.endTime,
//       'Status': req.status,
//     }));
//   }, [filteredData]);

//   // ✅ Datatable Columns
// const columns = useMemo(
//   () => [
//     {
//       name: 'S.No.',
//       cell: (_row: LeaveRequest, index?: number) => (index !== undefined ? index + 1 : 0),
//       width: '80px',
//     },
//     {
//       name: 'Astrologer',
//       selector: (row: LeaveRequest) =>
//         row?.astrologerId?.astrologerName
//           ? row.astrologerId.astrologerName.toUpperCase()
//           : '-',
//       width: '200px',
//     },
//     {
//       name: 'Start Date',
//       selector: (row: LeaveRequest) => moment(row.startDate).format('DD-MMM-YYYY'),
//     },
//     {
//       name: 'Start Time',
//       selector: (row: LeaveRequest) => row.startTime,
//     },
//     {
//       name: 'End Date',
//       selector: (row: LeaveRequest) => moment(row.endDate).format('DD-MMM-YYYY'),
//     },
//     {
//       name: 'End Time',
//       selector: (row: LeaveRequest) => row.endTime,
//     },
//     {
//       name: 'Status',
//       cell: (row: LeaveRequest) => (
//         <div style={{ textTransform: 'capitalize' }}>{row.status}</div>
//       ),
//     },
//     {
//       name: 'Action',
//       cell: (row: LeaveRequest) => (
//         <select
//           value={row.status}
//           onChange={(e) =>
//             handleStatusChange(row._id, e.target.value as LeaveRequest['status'])
//           }
//           style={{
//             padding: '4px 6px',
//             borderRadius: '5px',
//             border: '1px solid #ccc',
//             background: '#fff',
//           }}
//         >
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       ),
//     },
//   ],
//   []
// );

//   // ✅ Render
//   return (
//     <>

//       <MainDatatable
//         columns={columns}
//         data={filteredData}
//         title='Leave Request'
//         url="/astrologer/leave-request"
//         isLoading={loading}
//         addButtonActive={false}
//       />
//     </>
//   );
// };

// export default LeaveRequestPage;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Leave Request under progress...........
    </div>
  )
}

export default page
