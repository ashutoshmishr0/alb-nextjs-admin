'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import moment from "moment";
import Swal from "sweetalert2";

interface Skill {
  _id: string;
  skill: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  skills: Skill[];
  success: boolean;
  message?: string;
}

const Skill = () => {
  const router = useRouter();
  const [skillData, setSkillData] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // API call functions
  const getSkill = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/get-skill`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        // Sort in descending order by createdAt (newest first)
        const sortedData = [...(data.skills || [])].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setSkillData(sortedData);
      } else {
        console.error('Failed to fetch skills:', data.message);
        setSkillData([]);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkillData([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (skillId: string, skillName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete the skill "${skillName}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await fetch(`/api/admin/delete-skill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ skillId }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Skill has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false
          });
          getSkill();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: data.message || 'Failed to delete skill.'
          });
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Something went wrong while deleting skill.'
        });
        console.error('Error deleting skill:', error);
      }
    }
  };

  // DataTable Columns
  const columns = [
    { 
      name: 'S.No.', 
      selector: (row: Skill, index?: number) => (index || 0) + 1,
      width: '80px'
    },
    { 
      name: 'Skills', 
      selector: (row: Skill) => (
        <div className="capitalize">{row?.skill || 'N/A'}</div>
      )
    },
    { 
      name: 'Created Date', 
      selector: (row: Skill) => moment(row?.createdAt)?.format('DD/MM/YYYY hh:mm a') 
    },
    {
      name: 'Action',
      cell: (row: Skill) => (
        <div className="flex gap-5 items-center">
          <div 
            onClick={() => router.push(`/skill/add-skill?edit=true&id=${row._id}&skill=${encodeURIComponent(row.skill)}`)} 
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <EditSvg />
          </div>
          <div 
            onClick={() => deleteSkill(row._id, row.skill)} 
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <DeleteSvg />
          </div>
        </div>
      ),
      width: "180px",
      center: true
    },
  ];

  useEffect(() => {
    getSkill();
  }, []);

  return (
    <div >
      <MainDatatable 
        data={skillData} 
        columns={columns} 
        title={'Skill'} 
        url={'/skill/add-skill'}
        isLoading={loading}
      />
    </div>
  );
};

export default Skill;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Skills under progress...........
//     </div>
//   )
// }

// export default page
