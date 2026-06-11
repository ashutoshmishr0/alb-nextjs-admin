'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import Swal from "sweetalert2";

interface Remedies {
  _id: string;
  title: string;
  description: string;
  remedy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  remedies: never[];
  success: boolean;
  data: T;
  message?: string;
}

const Remedies = () => {
  const router = useRouter();
  const [remediesData, setRemediesData] = useState<Remedies[]>([]);
  const [loading, setLoading] = useState(true);

  // API call functions
  const getRemedies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/view-remedy`);
      const data: ApiResponse<Remedies[]> = await response.json();
      
      if (data.success) {
        setRemediesData(data.remedies || []);
      } else {
        console.error('Failed to fetch remedies:', data.message);
      }
    } catch (error) {
      console.error('Error fetching remedies:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRemedies = async (remedyId: string, remedyTitle: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete the remedy "${remedyTitle}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/delete-remedy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ remedyId }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          Swal.fire(
            'Deleted!',
            'Remedy has been deleted successfully.',
            'success'
          );
          getRemedies();
        } else {
          Swal.fire(
            'Error!',
            data.message || 'Failed to delete remedy.',
            'error'
          );
        }
      } catch (error) {
        Swal.fire(
          'Error!',
          'Something went wrong while deleting remedy.',
          'error'
        );
        console.error('Error deleting remedy:', error);
      }
    }
  };

  const openTextModal = (title: string, text: string) => {
    Swal.fire({
      title: title,
      html: `<div class="text-left max-h-96 overflow-y-auto">${text}</div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: '600px',
      customClass: {
        popup: 'rounded-lg',
        htmlContainer: 'text-left'
      }
    });
  };

  // DataTable Columns
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: Remedies, index?: number) => (index || 0) + 1, 
      width: '80px' 
    },
    { 
      name: 'Remedies', 
      selector: (row: Remedies) => row?.title || 'N/A', 
      width: "200px" 
    },
    { 
      name: 'Description', 
      cell: (row: Remedies) => (
        <div 
          onClick={() => openTextModal('Description', row?.description || '')}
          className="cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
        >
          {row?.description 
            ? row.description.length > 100 
              ? row.description.substring(0, 100) + '...' 
              : row.description
            : 'N/A'
          }
        </div>
      ),
      center: true
    },

{
  name: 'Action',
  cell: (row: Remedies) => (
    <div className="flex gap-5 items-center justify-center">
      <div 
       onClick={() => {
  // Store remedy data in sessionStorage
  sessionStorage.setItem('editRemedyData', JSON.stringify(row));
  // Navigate to edit page
  router.push('/remedies/edit-remedies');
}}
        className="cursor-pointer hover:opacity-70 transition-opacity"
      >
        <EditSvg />
      </div>
      <div 
        onClick={() => deleteRemedies(row._id, row.title)} 
        className="cursor-pointer hover:opacity-70 transition-opacity"
      >
        <DeleteSvg />
      </div>
    </div>
  ),
  width: "180px"
}
  ];

  useEffect(() => {
    getRemedies();
  }, []);

  return (
    <div >
      <MainDatatable 
        data={remediesData} 
        columns={columns} 
        title={'Remedies'} 
        url={'/remedies/add-remedies'}
        isLoading={loading}
      />
    </div>
  );
};

export default Remedies;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Remedies under progress...........
//     </div>
//   )
// }

// export default page
