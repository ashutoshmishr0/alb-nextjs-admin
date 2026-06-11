"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainDatatable from "@/components/common/MainDatatable";
import { DeleteSvg, EditSvg } from "@/components/svgs/page";
import Swal from "sweetalert2";

interface LanguageData {
    _id: string;
    languageName: string;
}

const Language = () => {
    const router = useRouter();
    const [languageData, setLanguageData] = useState<LanguageData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // DataTable Columns
    const categoryColumns = [
        {
            name: 'S.No',
            selector: (row: LanguageData, index?: number) => (index || 0) + 1,
            width: '80px'
        },
        {
            name: 'Language',
            selector: (row: LanguageData) => row?.languageName,
            center: true
        },
        {
            name: 'Action',
            cell: (row: LanguageData) => (
                <div className="flex gap-5 items-center">
                    <div
                        onClick={() => handleEdit(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                    >
                        <EditSvg />
                    </div>
                    <div
                        onClick={() => handleDelete(row._id, row.languageName)}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                    >
                        <DeleteSvg />
                    </div>
                </div>
            ),
            width: "180px"
        },
    ];

    // Fetch languages from API
    const fetchLanguages = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/get_language`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch languages');
            }

            const data = await response.json();
            console.log("API Response:", data);

            if (data.success) {
                setLanguageData(data.languageData || []);
                // Removed the success Swal.fire for loading
            } else {
                throw new Error(data.message || 'Failed to fetch languages');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching languages';
            setError(errorMessage);
            console.error('Error fetching languages:', err);

            await Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: errorMessage,
                confirmButtonColor: '#d33',
            });
        } finally {
            setLoading(false);
        }
    };

    // Updated edit function to pass data via URL params
    const handleEdit = (language: LanguageData) => {
        // Create URLSearchParams to pass data
        const params = new URLSearchParams();
        params.set('edit', 'true');
        params.set('id', language._id);
        params.set('name', encodeURIComponent(language.languageName));

        router.push(`/language/add-language?${params.toString()}`);
    };

    // Delete function
    const handleDelete = async (langId: string, languageName: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to delete "${languageName}"!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            background: '#fff',
            color: '#1f2937'
        });

        if (result.isConfirmed) {
            try {
                // Show loading state
                Swal.fire({
                    title: 'Deleting...',
                    text: `Deleting "${languageName}"`,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch(`/api/admin/delete_language`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ langId: langId }),
                });

                // Handle 204 No Content and other success statuses
                if (response.status === 204 || response.ok) {
                    await fetchLanguages();
                    await Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: `"${languageName}" has been deleted successfully.`,
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    // Handle error responses
                    const errorText = await response.text();
                    let errorMessage = `Server error: ${response.status}`;

                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        if (errorText) errorMessage = errorText;
                    }

                    throw new Error(errorMessage);
                }

            } catch (err) {
                console.error('Error deleting language:', err);
                await Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed!',
                    text: err instanceof Error ? err.message : 'Failed to delete language',
                    confirmButtonColor: '#d33',
                });
            }
        }
    };

    // Handle retry with Swal confirmation
    const handleRetry = async () => {
        const result = await Swal.fire({
            title: 'Retry?',
            text: 'Do you want to try loading languages again?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, retry!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            await fetchLanguages();
        }
    };

    useEffect(() => {
        fetchLanguages();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Loading languages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="text-red-600 bg-red-50 p-6 rounded-lg border border-red-200 max-w-md">
                        <p className="font-semibold text-lg mb-2">Error loading languages</p>
                        <p className="text-gray-700 mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Retry Loading
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {languageData.length === 0 && !loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="text-gray-600 bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-md">
                            <p className="font-semibold text-lg mb-2">No Languages Found</p>
                            <p className="text-gray-700 mb-4">There are no languages available at the moment.</p>
                            <button
                                onClick={fetchLanguages}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <MainDatatable
                    data={languageData}
                    columns={categoryColumns}
                    title={'Language'}
                    url={'/language/add-language'}
                    isLoading={loading}
                />
            )}
        </>
    );
};

export default Language;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       Work under progress...........
//     </div>
//   )
// }

// export default page
