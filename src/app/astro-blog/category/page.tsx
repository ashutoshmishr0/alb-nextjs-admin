'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { TableColumn } from 'react-data-table-component';
import Swal from 'sweetalert2';
import MainDatatable from '@/components/common/MainDatatable';
import DatatableHeading from '@/components/datatable/DatatableHeading';
import { base_url } from '@/lib/api-routes';
import { EditSvg, DeleteSvg } from '@/components/svgs/page';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface BlogCategory {
  _id: string;
  blog_category: string;
  createdAt: string;
}

interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

// ---------------------------------------------------------------------
// Utility: Deep Search
// ---------------------------------------------------------------------
const deepSearch = <T,>(data: T[], searchText: string): T[] => {
  if (!searchText) return data;
  const lowerSearch = searchText.toLowerCase();
  return data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(lowerSearch)
  );
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
const CategoryPage: React.FC = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [filteredData, setFilteredData] = useState<BlogCategory[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog-category-list`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categoryBlog || []);
      setFilteredData(data.categoryBlog || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Category with SweetAlert
  const handleDelete = async (categoryId: string, categoryName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete category "${categoryName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

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

      const res = await fetch(`/api/admin/delete_blog_category`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });

      if (!res.ok) throw new Error('Failed to delete category');

      await fetchCategories();

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Category has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete category'
      });
    }
  };

  // Edit: Store category in sessionStorage and navigate
  const handleEdit = (category: BlogCategory) => {
    sessionStorage.setItem('editBlogCategory', JSON.stringify(category));
    router.push('/astro-blog/category/add-category');
  };

  // Search filtering
  useEffect(() => {
    setFilteredData(deepSearch(categories, searchText));
  }, [searchText, categories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // CSV Data
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((category, index) => ({
      'S.No.': index + 1,
      'Title': category.blog_category,
      'Created Date': moment(category.createdAt).format('DD MMM YYYY hh:mm a'),
    }));
  }, [filteredData]);

  // Datatable Columns
  const columns = useMemo(
    () => [
      {
        name: 'S.No.',
        selector: (_row: any, index?: number) => (index !== undefined ? index + 1 : 0),
        width: '80px',
      },
      {
        name: 'Title',
        selector: (row: any) => row?.blog_category || '-',
      },
      {
        name: 'Created Date',
        selector: (row: any) => moment(row?.createdAt).format('DD/MM/YYYY @ hh:mm a'),
      },
      {
        name: 'Action',
        cell: (row: any) => (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div
              onClick={() => handleEdit(row)}
              style={{ cursor: 'pointer' }}
            >
              <EditSvg />
            </div>
            <div
              onClick={() => handleDelete(row._id, row.blog_category)}
              style={{ cursor: 'pointer' }}
            >
              <DeleteSvg />
            </div>
          </div>
        ),
        width: '180px',
      },
    ],
    [router]
  );

  return (
    <MainDatatable
      columns={columns}
      data={filteredData}
      title='Blog category'
      url="/astro-blog/category/add-category"
      isLoading={loading}
    />
  );
};

export default CategoryPage;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Blog category under progress...........
//     </div>
//   )
// }

// export default page
