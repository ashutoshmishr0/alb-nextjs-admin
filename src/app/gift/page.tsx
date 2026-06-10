// 'use client';
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { EditSvg, DeleteSvg } from "@/components/svgs/page";
// import MainDatatable from "@/components/common/MainDatatable";
// import Swal from "sweetalert2";

// interface Gift {
//   _id: string;
//   gift: string;
//   amount: number;
//   giftIcon: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface ApiResponse<T> {
//   gift: never[];
//   success: boolean;
//   data: T;
//   message?: string;
// }

// const Gift = () => {
//   const router = useRouter();
//   const [giftData, setGiftData] = useState<Gift[]>([]);
//   const [loading, setLoading] = useState(true);

//   // API call functions
//   const getGiftData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/admin/get-all-gift`);
//       const data: ApiResponse<Gift[]> = await response.json();
      
//       if (data.success) {
//         setGiftData(data.gift|| []);
//       } else {
//         console.error('Failed to fetch gifts:', data.message);
//       }
//     } catch (error) {
//       console.error('Error fetching gifts:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteGift = async (giftId: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this gift!",
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
//         const response = await fetch(`/api/admin/delete-gift`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ giftId: giftId }),
//         });
        
//         const data = await response.json();
        
//         if (data.success) {
//           Swal.fire(
//             'Deleted!',
//             'Gift has been deleted successfully.',
//             'success'
//           );
//           getGiftData();
//         } else {
//           Swal.fire(
//             'Error!',
//             data.message || 'Failed to delete gift.',
//             'error'
//           );
//         }
//       } catch (error) {
//         Swal.fire(
//           'Error!',
//           'Something went wrong while deleting gift.',
//           'error'
//         );
//         console.error('Error deleting gift:', error);
//       }
//     }
//   };

//   // DataTable Columns
//   const columns = [
//     { 
//       name: 'S.No.', 
//       selector: (row: Gift, index?: number) => (index || 0) + 1,
//       style: {paddingLeft: "20px" }
//     },
//     { 
//       name: 'Gift', 
//       selector: (row: Gift) => row?.gift || 'N/A'
//     },
//     { 
//       name: 'Amount', 
//       selector: (row: Gift) => `₹${row.amount}` || 'N/A'
//     },
//     { 
//       name: 'Icon', 
//       cell: (row: Gift) => (
//         <div className="flex justify-center">
//           <div className="relative w-12 h-12">
//             <img
//               src={row?.giftIcon ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${row.giftIcon}` : '/images/placeholder.png'}
//               alt="Gift icon"
              
//               className="rounded-lg object-cover"
//             />
//           </div>
//         </div>
//       )
//     },
//     {
//       name: 'Action',
//       cell: (row: Gift) => (
//         <div className="flex gap-5 items-center">
//           <div 
//             onClick={() => router.push(`/gift/add-gift?edit=true&id=${row._id}`)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity"
//           >
//             <EditSvg />
//           </div>
//           <div 
//             onClick={() => deleteGift(row._id)} 
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
//     getGiftData();
//   }, []);

//   return (
//     <div>
//       <MainDatatable 
//         data={giftData} 
//         columns={columns} 
//         title={'Gift'} 
//         url={'/gift/add-gift'}
//         isLoading={loading}
//       />
//     </div>
//   );
// };

// export default Gift;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Gift under progress...........
    </div>
  )
}

export default page
