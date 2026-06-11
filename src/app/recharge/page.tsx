// 'use client';
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import MainDatatable from "@/components/common/MainDatatable";
// import { DeleteSvg, SwitchOffSvg, SwitchOnSvg } from "@/components/svgs/page";
// import moment from "moment";
// import Swal from "sweetalert2";

// interface RechargePlan {
//   _id: string;
//   amount: number;
//   percentage: number;
//   startDate: string;
//   endDate: string;
//   recharge_status: "Active" | "Inactive";
// }

// interface ApiResponse<T> {
//   allRechargePlan: RechargePlan[];
//   success: boolean;
//   data: T;
//   message?: string;
//   rechargePlans?: RechargePlan[];
// }

// const Recharge = () => {
//   const router = useRouter();
//   const [rechargePlanData, setRechargePlanData] = useState<RechargePlan[]>([]);
//   const [loading, setLoading] = useState(true);

//   // API call functions
//   const getRechargePlan = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/admin/get-all-recharge-plans`);
//       const data: ApiResponse<RechargePlan[]> = await response.json();
      
//       if (data.success) {
//         setRechargePlanData(data.allRechargePlan || data.data || []);
//       } else {
//         console.error('Failed to fetch recharge plans:', data.message);
//         Swal.fire('Error!', data.message || 'Failed to fetch recharge plans', 'error');
//       }
//     } catch (error) {
//       console.error('Error fetching recharge plans:', error);
//       Swal.fire('Error!', 'Something went wrong while fetching recharge plans', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteRechargePlan = async (rechargePlanId: string) => {
//     const result = await Swal.fire({
//       title: 'Are you sure?',
//       text: "You want to delete this recharge plan!",
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
//         const response = await fetch(`/api/admin/delete-recharge-plan`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ rechargePlanId }),
//         });
        
//         const data = await response.json();
        
//         if (data.success) {
//           Swal.fire(
//             'Deleted!',
//             'Recharge plan has been deleted successfully.',
//             'success'
//           );
//           getRechargePlan();
//         } else {
//           Swal.fire(
//             'Error!',
//             data.message || 'Failed to delete recharge plan.',
//             'error'
//           );
//         }
//       } catch (error) {
//         Swal.fire(
//           'Error!',
//           'Something went wrong while deleting recharge plan.',
//           'error'
//         );
//         console.error('Error deleting recharge plan:', error);
//       }
//     }
//   };

//   const updateRechargePlanStatus = async (rechargePlanId: string, status: string) => {
//     try {
//       const response = await fetch(`/api/admin/update-recharge-plan-status`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           rechargePlanId, 
//           status
//         }),
//       });
      
//       const data = await response.json();
      
//       if (data.success) {
//         Swal.fire(
//           'Updated!',
//           'Recharge plan status updated successfully.',
//           'success'
//         );
//         getRechargePlan();
//       } else {
//         Swal.fire(
//           'Error!',
//           data.message || 'Failed to update recharge plan status.',
//           'error'
//         );
//       }
//     } catch (error) {
//       Swal.fire(
//         'Error!',
//         'Something went wrong while updating recharge plan status.',
//         'error'
//       );
//       console.error('Error updating recharge plan status:', error);
//     }
//   };

//   // DataTable Columns
//   const columns = [
//     { 
//       name: "S.No.", 
//       selector: (row: RechargePlan, index?: number) => (index || 0) + 1, 
//       width: '80px' 
//     },
//     { 
//       name: "Amount", 
//       selector: (row: RechargePlan) => `₹${row?.amount || 0}`
//     },
//     { 
//       name: "Extra P.Amount", 
//       selector: (row: RechargePlan) => `${row?.percentage || 0}%` 
//     },
//     { 
//       name: "Start Date", 
//       selector: (row: RechargePlan) => row?.startDate ? moment(row.startDate).format("DD/MM/YYYY") : "N/A"
//     },
//     { 
//       name: "End Date", 
//       selector: (row: RechargePlan) => row?.endDate ? moment(row.endDate).format("DD/MM/YYYY") : "N/A"
//     },
//     { 
//       name: 'Status', 
//       cell: (row: RechargePlan) => (
//         <div 
//           onClick={() => updateRechargePlanStatus(
//             row._id, 
//             row?.recharge_status === "Active" ? "Inactive" : "Active"
//           )} 
//           className="cursor-pointer hover:opacity-70 transition-opacity"
//         >
//           {row?.recharge_status === "Active" ? <SwitchOnSvg /> : <SwitchOffSvg />}
//         </div>
//       ), 
//       width: "120px", 
//       centre: true 
//     },
//     {
//       name: 'Action',
//       cell: (row: RechargePlan) => (
//         <div className="flex gap-5 items-center">
//           <div 
//             onClick={() => deleteRechargePlan(row._id)} 
//             className="cursor-pointer hover:opacity-70 transition-opacity"
//           >
//             <DeleteSvg />
//           </div>
//         </div>
//       ),
//       width: "150px", 
//       centre: true,
//     },
//   ];

//   useEffect(() => {
//     getRechargePlan();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <MainDatatable 
//         data={rechargePlanData} 
//         columns={columns} 
//         title={'Recharge'} 
//         url={'/recharge/add-recharge'}
//         isLoading={loading}
//       />
//     </div>
//   );
// };

// export default Recharge;

import React from 'react'

const page = () => {
  return (
    <div className='p-20'>
      Recharge under progress...........
    </div>
  )
}

export default page
