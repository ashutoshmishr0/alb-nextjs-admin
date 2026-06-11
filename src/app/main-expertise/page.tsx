'use client'
import React, { useEffect, useState } from "react";
import { Avatar } from "@mui/material";
import { DeleteSvg, EditSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface MainExpertise {
  _id: string;
  mainExpertise: string;
  description: string;
  image: string;
}

const MainExpertise = () => {
  const router = useRouter();
  const [mainExpertiseData, setMainExpertiseData] = useState<MainExpertise[]>([]);
  const [loading, setLoading] = useState(true);

  // DataTable Columns
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: MainExpertise) => mainExpertiseData.indexOf(row) + 1, 
      width: '80px' 
    },
    { 
      name: 'Title', 
      selector: (row: MainExpertise) => (
        <div className="capitalize">{row?.mainExpertise}</div>
      ) 
    },
    { 
      name: 'Description', 
      selector: (row: MainExpertise) => 
        row?.description ? (
          <div 
            onClick={() => openTextModal('Description', row.description)}
            dangerouslySetInnerHTML={{ __html: row.description.toString().slice(0, 50) }} 
            className="cursor-pointer"
          />
        ) : 'N/A' 
    },
    { 
      name: 'Image', 
      cell: (row: MainExpertise) => (
        <Avatar 
          src={process.env.NEXT_PUBLIC_IMAGE_URL + row?.image} 
          alt="Profile" 
          className="w-12 h-12 rounded-full"
        />
      ), 
      width: '100px' 
    },
    {
  name: 'Action',
  cell: (row: MainExpertise) => (
    <div className="flex gap-5 items-center">
      <div 
        onClick={() => router.push(`/main-expertise/add-main-expertise?edit=true&id=${row._id}`)} 
        className="cursor-pointer"
      >
        <EditSvg />
      </div>
      <div 
        onClick={() => handleDeleteMainExpertise(row)}
        className="cursor-pointer"
      >
        <DeleteSvg />
      </div>
    </div>
  ),
  width: "180px"
},
  ];

  const openTextModal = (title: string, text: string) => {
    // Implement your modal logic here
    // You can use a state management solution or a modal context
    console.log('Open modal:', title, text);
  };

  const getMainExpertise = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/get-all-main-expertise`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMainExpertiseData(data.mainExpertise);
      } else {
        console.error('Failed to fetch main expertise');
      }
    } catch (error) {
      console.error('Error fetching main expertise:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log(mainExpertiseData)

  const deleteMainExpertise = async (mainExpertiseId: string, mainExpertiseName: string) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You want to delete "${mainExpertiseName}"!`,
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
      const response = await fetch(`/api/admin/delete-main-expertise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mainExpertiseId }),
      });

      if (response.ok) {
        // Remove the item from local state
        setMainExpertiseData(prev => 
          prev.filter(item => item._id !== mainExpertiseId)
        );
        Swal.fire(
          'Deleted!',
          'Expertise has been deleted successfully.',
          'success'
        );
      } else {
        alert('Failed to delete main expertise');
      }
    } catch (error) {
      console.error('Error deleting main expertise:', error);
      alert('Error deleting main expertise');
    }
  }
};




// Update the handleDeleteMainExpertise to keep the same signature:
const handleDeleteMainExpertise = (row: MainExpertise) => {
  deleteMainExpertise(row._id, row.mainExpertise);
};

  useEffect(() => {
    getMainExpertise();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainDatatable 
      data={mainExpertiseData} 
      columns={columns} 
      title={'Main Expertise'} 
      url={'/main-expertise/add-main-expertise'} 
    />
  );
};

export default MainExpertise;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Main experties under progress...........
//     </div>
//   )
// }

// export default page
