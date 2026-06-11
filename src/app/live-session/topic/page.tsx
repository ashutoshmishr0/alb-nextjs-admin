// 'use client';
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { EditSvg, DeleteSvg } from "@/components/svgs/page";
// import MainDatatable from "@/components/common/MainDatatable";
// import moment from "moment";
// import Swal from "sweetalert2";

// interface Category {
//   _id: string;
//   categoryName: string;
// }

// interface LiveSessionTopic {
//   _id: string;
//   categoryId: Category;
//   topicName: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface ApiResponse<T> {
//   topics: never[];
//   success: boolean;
//   data: T;
//   message?: string;
// }

// const Topic = () => {
//   const router = useRouter();
//   const [liveSessionTopicData, setLiveSessionTopicData] = useState<LiveSessionTopic[]>([]);
//   const [loading, setLoading] = useState(true);

//   // API call functions
//   const getLiveSessionTopic = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/admin/get_live_session_topic`);
//       const data: ApiResponse<LiveSessionTopic[]> = await response.json();
      
//       if (data.success) {
//        setLiveSessionTopicData([...(data.topics || [])].reverse());
//       } else {
//         console.error('Failed to fetch topics:', data.message);
//       }
//     } catch (error) {
//       console.error('Error fetching topics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const deleteLiveSessionTopic = async (topicId: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this topic!",
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
//         const response = await fetch(`/api/admin/delete_live_session_topic`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ topicId }),
//         });
        
//         const data = await response.json();
        
//         if (data.success) {
//           Swal.fire(
//             'Deleted!',
//             'Topic has been deleted successfully.',
//             'success'
//           );
//           getLiveSessionTopic();
//         } else {
//           Swal.fire(
//             'Error!',
//             data.message || 'Failed to delete topic.',
//             'error'
//           );
//         }
//       } catch (error) {
//         Swal.fire(
//           'Error!',
//           'Something went wrong while deleting topic.',
//           'error'
//         );
//         console.error('Error deleting topic:', error);
//       }
//     }
//   };

//   const openTextModal = (title: string, text: string) => {
//     Swal.fire({
//       title: title,
//       html: `<div class="text-left max-h-96 overflow-y-auto">${text}</div>`,
//       showCloseButton: true,
//       showConfirmButton: false,
//       width: '600px',
//       customClass: {
//         popup: 'rounded-lg',
//         htmlContainer: 'text-left'
//       }
//     });
//   };

//   // DataTable Columns
//   const categoryColumns = [
//     { 
//       name: 'S.No.', 
//       selector: (row: LiveSessionTopic, index?: number) => (index || 0) + 1, 
//       width: '80px' 
//     },
//     { 
//       name: 'Category', 
//       selector: (row: LiveSessionTopic) => row?.categoryId?.categoryName || 'N/A'
//     },
//     { 
//       name: 'Topic', 
//       cell: (row: LiveSessionTopic) => (
//         <div 
//           onClick={() => openTextModal('Topic', row?.topicName || '')}
//           className="cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
//           dangerouslySetInnerHTML={{ 
//             __html: row?.topicName 
//               ? row.topicName.length > 50 
//                 ? row.topicName.slice(0, 50) + '...' 
//                 : row.topicName
//               : 'N/A'
//           }}
//         />
//       )
//     },
//     { 
//       name: 'Created Date', 
//       selector: (row: LiveSessionTopic) => moment(row?.createdAt)?.format('DD/MM/YYYY @ hh:mm a') 
//     },
//     {
//   name: 'Action',
//   cell: (row: LiveSessionTopic) => (
//     <div className="flex gap-5 items-center">
//       <div 
//         onClick={() => router.push(`/live-session/topic/add-topic?edit=true&id=${row._id}`)} 
//         className="cursor-pointer hover:opacity-70 transition-opacity"
//       >
//         <EditSvg />
//       </div>
//       <div 
//         onClick={() => deleteLiveSessionTopic(row._id)} 
//         className="cursor-pointer hover:opacity-70 transition-opacity"
//       >
//         <DeleteSvg />
//       </div>
//     </div>
//   ),
//   width: "180px"
// }
//   ];

//   useEffect(() => {
//     getLiveSessionTopic();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <MainDatatable 
//         data={liveSessionTopicData} 
//         columns={categoryColumns} 
//         title={'Session Topic'} 
//         url={'/live-session/topic/add-topic'}
//         isLoading={loading}
//       />
//     </div>
//   );
// };

// export default Topic;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Live session Topic under progress...........
    </div>
  )
}

export default page
