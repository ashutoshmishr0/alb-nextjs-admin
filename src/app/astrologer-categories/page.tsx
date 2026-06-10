'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import moment from "moment";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  categories: string;  // API returns "categories" field
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  categories: Category[];  // API returns "categories" array
  success: boolean;
  message?: string;
}

const CategoryList = () => {
  const router = useRouter();
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all categories
  const getCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/view-categories`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        // Sort descending by createdAt (newest first)
        const sortedData = [...(data.categories || [])].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCategoryData(sortedData);
      } else {
        console.error('Failed to fetch categories:', data.message);
        setCategoryData([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId: string, categoryName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete the category "${categoryName}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); },
        });

        const response = await fetch(`/api/admin/delete-categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),  // sending categoryId as per delete API
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Category has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false,
          });
          getCategories();  // refresh list
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: data.message || 'Failed to delete category.',
          });
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Something went wrong while deleting category.',
        });
        console.error('Error deleting category:', error);
      }
    }
  };

  // DataTable Columns
  const columns = [
    {
      name: 'S.No.',
      selector: (row: Category, index?: number) => (index || 0) + 1,
      width: '80px',
    },
    {
      name: 'Category',
      selector: (row: Category) => (
        <div className="capitalize">{row?.categories || 'N/A'}</div>  // "categories" field from API
      ),
    },
    {
      name: 'Created Date',
      selector: (row: Category) => moment(row?.createdAt)?.format('DD/MM/YYYY hh:mm a'),
    },
    {
      name: 'Action',
      cell: (row: Category) => (
        <div className="flex gap-5 items-center">
          <div
            onClick={() =>
              router.push(
                `/astrologer-categories/add-astrologer-categories?edit=true&id=${row._id}&category=${encodeURIComponent(row.categories)}`
              )
            }
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <EditSvg />
          </div>
          <div
            onClick={() => deleteCategory(row._id, row.categories)}
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <DeleteSvg />
          </div>
        </div>
      ),
      width: "180px",
      center: true,
    },
  ];

  useEffect(() => {
    getCategories();
  }, []);

  return (
    <div>
      <MainDatatable
        data={categoryData}
        columns={columns}
        title={'Categories'}
        url={'/astrologer-categories/add-astrologer-categories'}  
        isLoading={loading}
      />
    </div>
  );
};

export default CategoryList;