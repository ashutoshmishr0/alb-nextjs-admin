// 'use client';

// import React, { useEffect, useState, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import moment from 'moment';
// import MainDatatable from '@/components/common/MainDatatable';
// import { base_url } from '@/lib/api-routes';
// import { EditSvg, DeleteSvg } from '@/components/svgs/page';
// import Swal from 'sweetalert2';

// // ---------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------
// type MessageType = 'Astrologer' | 'Customer' | '';

// interface PredefinedMessage {
//   _id: string;
//   type: MessageType;
//   message: string;
//   createdAt?: string;
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
// const PredefinedMessage: React.FC = () => {
//   const router = useRouter();

//   const [messages, setMessages] = useState<PredefinedMessage[]>([]);
//   const [filteredData, setFilteredData] = useState<PredefinedMessage[]>([]);
//   const [searchText, setSearchText] = useState('');
//   const [loading, setLoading] = useState(true);

//   //* Fetch Messages
//   const fetchMessages = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`/api/admin/get_predefined_message`, {
//         cache: 'no-store',
//         headers: {
//           'Cache-Control': 'no-cache',
//         },
//       });
      
//       if (!res.ok) throw new Error('Failed to fetch messages');
      
//       const data = await res.json();
      
//       // Sort in descending order by createdAt (newest first)
//       const sortedData = [...(data?.result || [])].sort((a, b) => {
//         return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
//       });
      
//       setMessages(sortedData);
//       setFilteredData(sortedData);
//     } catch (err) {
//       console.error('Error fetching messages:', err);
//       await Swal.fire({
//         icon: 'error',
//         title: 'Error!',
//         text: 'Failed to fetch messages.',
//         confirmButtonColor: '#d33',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   //* Edit Message - Navigate to edit page with data
//   const handleEdit = (row: PredefinedMessage) => {
//     const params = new URLSearchParams({
//       id: row._id,
//       type: row.type,
//       message: row.message,
//       mode: 'Edit'
//     });
//     router.push(`/master/predefined-message/add-predefined-message?${params.toString()}`);
//   };

//   //* Delete Message
//   const handleDelete = async (id: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this message!",
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#6b7280',
//       confirmButtonText: 'Yes, delete it!',
//       cancelButtonText: 'Cancel',
//       reverseButtons: true
//     });

//     if (!result.isConfirmed) return;

//     try {
//       // Show loading
//       Swal.fire({
//         title: 'Deleting...',
//         text: 'Please wait',
//         allowOutsideClick: false,
//         didOpen: () => {
//           Swal.showLoading();
//         }
//       });

//       const res = await fetch(`/api/admin/delete_predefined_message`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id }),
//       });

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         throw new Error(err.message || 'Failed to delete');
//       }

//       await Swal.fire({
//         title: 'Deleted!',
//         text: 'Message has been deleted successfully.',
//         icon: 'success',
//         timer: 2000,
//         showConfirmButton: false
//       });

//       await fetchMessages();
//     } catch (error: any) {
//       console.error('Delete error:', error);
//       await Swal.fire({
//         title: 'Error!',
//         text: error.message || 'Failed to delete message',
//         icon: 'error',
//         confirmButtonColor: '#d33',
//       });
//     }
//   };

//   //* Open Full Message in Modal
//   const openMessageModal = (title: string, text: string) => {
//     Swal.fire({
//       title: title,
//       html: `<div style="text-align: left; white-space: pre-wrap; word-break: break-word;">${text}</div>`,
//       icon: 'info',
//       confirmButtonColor: '#3085d6',
//       width: '600px',
//       customClass: {
//         htmlContainer: 'swal-html-left'
//       }
//     });
//   };

//   //* Search filtering
//   useEffect(() => {
//     setFilteredData(deepSearch(messages, searchText));
//   }, [searchText, messages]);

//   //* Initial Load
//   useEffect(() => {
//     fetchMessages();
//   }, []);

//   //* Datatable Columns
//   const columns = useMemo(
//     () => [
//       {
//         name: 'S.No.',
//         selector: (_row: any, index?: number) => (index !== undefined ? index + 1 : 0),
//         width: '80px',
//       },
//       {
//         name: 'Type',
//         selector: (row: any) => row?.type || '-',
//         sortable: true,
//         width: '150px',
//       },
//       {
//         name: 'Message',
//         cell: (row: any) => (
//           <div
//             onClick={() => openMessageModal('Message', row.message)}
//             style={{
//               cursor: 'pointer',
//               whiteSpace: 'normal',
//               wordBreak: 'break-word',
//               maxWidth: '400px',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//             }}
//             title="Click to view full message"
//           >
//             {row.message || 'N/A'}
//           </div>
//         ),
//         center: true,
//       },
//       {
//         name: 'Created At',
//         selector: (row: PredefinedMessage) =>
//           row?.createdAt ? moment(row.createdAt).format('DD/MM/YYYY @ hh:mm a') : '-',
//         sortable: true,
//         width: '200px',
//       },
//       {
//         name: 'Action',
//         cell: (row: any) => (
//           <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
//             <div onClick={() => handleEdit(row)} style={{ cursor: 'pointer' }}>
//               <EditSvg />
//             </div>
//             <div onClick={() => handleDelete(row._id)} style={{ cursor: 'pointer' }}>
//               <DeleteSvg />
//             </div>
//           </div>
//         ),
//         width: '120px',
//         center: true,
//       },
//     ],
//     []
//   );

//   //* Render
//   return (
//     <>
//       <MainDatatable
//         columns={columns}
//         data={filteredData}
//         title="Predefined Messages"
//         url="/master/predefined-message/add-predefined-message"
//         isLoading={loading}
//       />
//     </>
//   );
// };

// export default PredefinedMessage;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      predefiend messages under progress...........
    </div>
  )
}

export default page
