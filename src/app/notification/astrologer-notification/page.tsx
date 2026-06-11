// 'use client';
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Avatar } from "@mui/material";
// import Swal from "sweetalert2";

// interface Notification {
//   _id: string;
//   title: string;
//   description: string;
//   image: string;
// }

// interface Column {
//   name: string;
//   cell: (row: Notification, index: number) => React.ReactNode;
// }

// const AstrologerNotification = () => {
//   const router = useRouter();
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(true);

//   // API call to get notifications
//   const getAstrologerNotifications = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/admin/get-astrologer-notification`);
//       const data = await response.json();
      
//       if (data.success) {
//         setNotifications(data.notifications || data.data || []);
//       } else {
//         console.error('Failed to fetch notifications:', data.message);
//         Swal.fire({
//           icon: 'error',
//           title: 'Error!',
//           text: 'Failed to load notifications',
//           confirmButtonColor: '#d33',
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Network Error!',
//         text: 'Please check your connection and try again.',
//         confirmButtonColor: '#d33',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Delete notification
//   const deleteNotification = async (notificationId: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this notification!",
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#d1d5db',
//       confirmButtonText: 'Delete',
//       cancelButtonText: 'Cancel',
//       reverseButtons: true
//     });

//     if (result.isConfirmed) {
//       try {
//         const response = await fetch(`/api/admin/delete-astrologer-notification`, {
//           method: 'DELETE',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ notificationId }),
//         });
        
//         const data = await response.json();
        
//         if (data.success) {
//           Swal.fire(
//             'Deleted!',
//             'Notification has been deleted successfully.',
//             'success'
//           );
//           getAstrologerNotifications();
//         } else {
//           Swal.fire(
//             'Error!',
//             data.message || 'Failed to delete notification.',
//             'error'
//           );
//         }
//       } catch (error) {
//         Swal.fire(
//           'Error!',
//           'Something went wrong while deleting notification.',
//           'error'
//         );
//         console.error('Error deleting notification:', error);
//       }
//     }
//   };

//   // Open description modal
//   const openDescriptionModal = (title: string, description: string) => {
//     Swal.fire({
//       title: title,
//       html: `<div class="text-left max-h-96 overflow-y-auto">${description}</div>`,
//       showCloseButton: true,
//       showConfirmButton: false,
//       width: '600px',
//       customClass: {
//         popup: 'rounded-lg',
//         htmlContainer: 'text-left'
//       }
//     });
//   };

//   // Datatable Columns
//   const columns: Column[] = [
//     { 
//       name: 'S.No.', 
//       cell: (row: Notification, index: number) => (
//         <div className="pl-5">{index + 1}</div>
//       )
//     },
//     { 
//       name: 'Title', 
//       cell: (row: Notification) => (
//         <div className="font-medium text-gray-900">{row.title}</div>
//       )
//     },
//     { 
//       name: 'Description', 
//       cell: (row: Notification) => (
//         <div 
//           className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors line-clamp-2"
//           onClick={() => openDescriptionModal('Description', row.description)}
//         >
//           {row.description 
//             ? row.description.length > 50 
//               ? row.description.substring(0, 50) + '...' 
//               : row.description
//             : 'N/A'
//           }
//         </div>
//       )
//     },
//     { 
//       name: 'Icon', 
//       cell: (row: Notification) => (
//         <Avatar 
//           src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${row.image}`}
//           sx={{ width: 50, height: 50 }}
//           variant="square"
//         />
//       )
//     },
//     { 
//       name: 'Action', 
//       cell: (row: Notification) => (
//         <div className="flex gap-5 items-center">
//           <div 
//             onClick={() => router.push(`/notification/add-notification?edit=true&id=${row._id}&type=Astrologer`)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity"
//           >
//             {/* Add your EditSvg component here */}
//             <span className="text-blue-600">Edit</span>
//           </div>
//           <div 
//             onClick={() => deleteNotification(row._id)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity text-red-600"
//           >
//             {/* Add your DeleteSvg component here */}
//             <span>Delete</span>
//           </div>
//         </div>
//       )
//     },
//   ];

//   useEffect(() => {
//     getAstrologerNotifications();
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-xl text-gray-600">Loading notifications...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b border-gray-200">
//           <h1 className="text-xl font-semibold text-gray-800">Astrologer Notification</h1>
//           <button 
//             onClick={() => router.push("/notification/add-notification?type=Astrologer")}
//             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
//           >
//             Add Notification
//           </button>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 {columns.map((column, index) => (
//                   <th 
//                     key={index}
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     {column.name}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {notifications.map((row, index) => (
//                 <tr key={row._id} className="hover:bg-gray-50">
//                   {columns.map((column, colIndex) => (
//                     <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {column.cell(row, index)}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//               {notifications.length === 0 && (
//                 <tr>
//                   <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
//                     No notifications found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AstrologerNotification;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Astrologer Notoficaations under progress...........
    </div>
  )
}

export default page
