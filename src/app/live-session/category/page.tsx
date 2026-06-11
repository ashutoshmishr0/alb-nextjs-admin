// 'use client';
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { EditSvg, DeleteSvg } from "@/components/svgs/page";
// import MainDatatable from "@/components/common/MainDatatable";
// import moment from "moment";
// import Swal from "sweetalert2";

// interface LiveSessionCategory {
//   _id: string;
//   categoryName: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface ApiResponse<T> {
//   categories: never[];
//   success: boolean;
//   data: T;
//   message?: string;
// }

// const Category = () => {
//   const router = useRouter();
//   const [liveSessionCategoryData, setLiveSessionCategoryData] = useState<LiveSessionCategory[]>([]);
//   const [loading, setLoading] = useState(true);

//   // API call functions
//   const getLiveSessionCategory = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/admin/get_live_session_category`);
//       const data: ApiResponse<LiveSessionCategory[]> = await response.json();
      
//       if (data.success) {
//         setLiveSessionCategoryData([...data.categories  || []].reverse());
//         // setLiveSessionTopicData([...(data.topics || [])].reverse());
//       } else {
//         console.error('Failed to fetch categories:', data.message);
//       }
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteLiveSessionCategory = async (categoryId: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this category!",
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
//         const response = await fetch(`/api/admin/delete_live_session_category`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ categoryId }),
//         });
        
//         const data = await response.json();
        
//         if (data.success) {
//           Swal.fire(
//             'Deleted!',
//             'Category has been deleted successfully.',
//             'success'
//           );
//           getLiveSessionCategory();
//         } else {
//           Swal.fire(
//             'Error!',
//             data.message || 'Failed to delete category.',
//             'error'
//           );
//         }
//       } catch (error) {
//         Swal.fire(
//           'Error!',
//           'Something went wrong while deleting category.',
//           'error'
//         );
//         console.error('Error deleting category:', error);
//       }
//     }
//   };

//   // DataTable Columns
//   const columns = [
//     { 
//       name: 'S.No.', 
//       selector: (row: LiveSessionCategory, index?: number) => (index || 0) + 1, 
//       width: '80px' 
//     },
//     { 
//       name: 'Title', 
//       selector: (row: LiveSessionCategory) => row?.categoryName 
//     },
//     { 
//       name: 'Created Date', 
//       selector: (row: LiveSessionCategory) => moment(row?.createdAt)?.format('DD/MM/YYYY @ hh:mm a') 
//     },
//     {
//       name: 'Action',
//       cell: (row: LiveSessionCategory) => (
//         <div className="flex gap-5 items-center">
//           <div 
//             onClick={() => router.push(`/live-session/category/add-category?edit=true&id=${row._id}&name=${encodeURIComponent(row.categoryName)}`)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity"
//           >
//             <EditSvg />
//           </div>
//           <div 
//             onClick={() => deleteLiveSessionCategory(row._id)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity"
//           >
//             <DeleteSvg />
//           </div>
//         </div>
//       ),
//       width: "180px"
//     },
//   ];

//   useEffect(() => {
//     getLiveSessionCategory();
//   }, []);

//   return (
//     <div >
//       <MainDatatable 
//         data={liveSessionCategoryData} 
//         columns={columns} 
//         title={'Session Category'} 
//         url={'/live-session/category/add-category'}
//         isLoading={loading}
//       />
//     </div>
//   );
// }

// export default Category;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Live session category progress...........
    </div>
  )
}

export default page
