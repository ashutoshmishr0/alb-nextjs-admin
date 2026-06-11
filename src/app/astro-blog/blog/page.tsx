"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import {
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TableColumn } from "react-data-table-component";
import Swal from "sweetalert2";
import MainDatatable from "@/components/common/MainDatatable";
import { base_url } from "@/lib/api-routes";
import { DeleteSvg, EditSvg } from "@/components/svgs/page";


interface BlogCategory {
  _id: string;
  blog_category: string;
}

interface Blog {
  _id: string;
  title: string;
  blogCategoryId: BlogCategory;
  description: string;
  created_by: string;
  image: string;
  createdAt: string;
  viewsCount: number;
}

interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

interface TextModalState {
  open: boolean;
  title: string;
  text: string;
}

const deepSearch = <T,>(data: T[], searchText: string): T[] => {
  if (!searchText) return data;
  const lowerSearch = searchText.toLowerCase();
  return data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(lowerSearch)
  );
};


const AstroblogPage: React.FC = () => {
  const router = useRouter();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredData, setFilteredData] = useState<Blog[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [textModal, setTextModal] = useState<TextModalState>({
    open: false,
    title: "",
    text: "",
  });

  // Fetch Blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/get_astro_blogs`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const data = await res.json();
      setBlogs(data.blogs || []);
      setFilteredData(data.blogs || []);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string, blogTitle: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete blog "${blogTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`/api/admin/delete_astro_blogs`, {
        method: "POST",
        credentials: 'include', 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });

      if (!res.ok) throw new Error("Failed to delete blog");

      await fetchBlogs();

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Blog has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error deleting blog:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete blog'
      });
    }
  };

  // Edit: Store full blog in sessionStorage
  const handleEdit = (blog: Blog) => {
    sessionStorage.setItem("editBlogData", JSON.stringify(blog));
    router.push("/astro-blog/blog/add-blog");
  };

  // Open Text Modal
  const openTextModal = (title: string, text: string) => {
    setTextModal({ open: true, title, text });
  };

  const closeTextModal = () => {
    setTextModal({ open: false, title: "", text: "" });
  };

  // Search filtering
  useEffect(() => {
    setFilteredData(deepSearch(blogs, searchText));
  }, [searchText, blogs]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  // CSV Data
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((blog, index) => ({
      "S.No.": index + 1,
      Title: blog.title,
      Category: blog.blogCategoryId?.blog_category || "-",
      "Created By": blog.created_by,
      Date: moment(blog.createdAt).format("DD MMM YYYY"),
      "View Count": blog.viewsCount,
    }));
  }, [filteredData]);

  // Datatable Columns
  const columns: TableColumn<Blog>[] = useMemo(
    () => [
      {
        name: "S.No.",
        selector: (_row, index) => (index !== undefined ? index + 1 : 0),
        width: "80px",
      },
      {
        name: "Title",
        selector: (row) => row?.title || "-",
        // width: "150px",
      },
      {
        name: "Category",
        selector: (row) => row?.blogCategoryId?.blog_category || "-",
      },
      {
        name: "Description",
        cell: (row) =>
          row?.description ? (
            <div
              onClick={() => openTextModal("Description", row.description)}
              dangerouslySetInnerHTML={{
                __html: row.description.slice(0, 25),
              }}
              className="cursor-pointer text-[#1976d2] line-clamp-1"
            />
          ) : (
            <span>N/A</span>
          ),
        // width: "200px",
      },
      {
        name: "Created By",
        selector: (row) => row?.created_by || "-",
        // width: "150px",
      },
      {
        name: "Image",
        cell: (row) => (
          <Avatar
            src={row?.image ? `${process.env.NEXT_PUBLIC_IMAGE_URL}uploads/${row.image}` : ""}
            alt="Blog"
            sx={{ width: 40, height: 40 }}
          />
        ),
        width: "100px",
      },
      {
        name: "Date",
        selector: (row) => moment(row?.createdAt).format("DD/MM/YYYY"),
        // width: "150px",
      },
      // {
      //   name: "View Count",
      //   selector: (row) => row?.viewsCount || 0,
      //   width: "110px",
      // },
      {
        name: "Action",
        cell: (row) => (
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div onClick={() => handleEdit(row)} style={{ cursor: "pointer" }}>
              <EditSvg />
            </div>
            <div
              onClick={() => handleDelete(row._id, row.title)}
              style={{ cursor: "pointer" }}
            >
              <DeleteSvg />
            </div>
          </div>
        ),
        width: "150px",
      },
    ],
    [router]
  );

  return (
    <>
      <MainDatatable
        title="Astroblog"
        columns={columns as any}
        data={filteredData}
        isLoading={loading}
        url={"/astro-blog/blog/add-blog"}
      />

      {/* Description Modal */}
      <Dialog
        open={textModal.open}
        onClose={closeTextModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{textModal.title}</span>
            <IconButton onClick={closeTextModal} size="small">
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div
            dangerouslySetInnerHTML={{ __html: textModal.text }}
            style={{ padding: "10px", maxHeight: "500px", overflowY: "auto" }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AstroblogPage;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Blog under progress...........
//     </div>
//   )
// }

// export default page
