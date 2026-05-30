'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface LanguageDetail {
    title: string;
}

interface InputFieldError {
    title: string;
}

function AddLanguageReview() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const editMode = searchParams.get('edit') === 'true';
    const languageId = searchParams.get('id');
    const languageNameFromUrl = searchParams.get('name');

    const [languageDetail, setLanguageDetail] = useState<LanguageDetail>({
        title: languageNameFromUrl ? decodeURIComponent(languageNameFromUrl) : ''
    });
    const [inputFieldError, setInputFieldError] = useState<InputFieldError>({
        title: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(editMode && !languageNameFromUrl);

    // Fetch language data if in edit mode and name not in URL
    useEffect(() => {
        const fetchLanguageData = async () => {
            if (editMode && languageId && !languageNameFromUrl) {
                try {
                    setFetching(true);
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/get_language/${languageId}`
                    );

                    if (!response.ok) {
                        throw new Error('Failed to fetch language');
                    }

                    const data = await response.json();

                    if (data.success && data.data) {
                        setLanguageDetail({ title: data.data.languageName });
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: data.message || 'Failed to fetch language data',
                            confirmButtonColor: '#d33',
                        });
                    }
                } catch (error) {
                    console.error('Error fetching language:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Error fetching language data',
                        confirmButtonColor: '#d33',
                    });
                } finally {
                    setFetching(false);
                }
            }
        };

        fetchLanguageData();
    }, [editMode, languageId, languageNameFromUrl]);

    //* Handle Input Field : Error
    const handleInputFieldError = (input: keyof InputFieldError, value: string) =>
        setInputFieldError((prev) => ({ ...prev, [input]: value }));

    //* Handle Input Field : Data
    const handleInputField = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLanguageDetail({ ...languageDetail, [event.target.name]: event.target.value });
        // Clear error when user starts typing
        if (inputFieldError.title) {
            handleInputFieldError("title", "");
        }
    };

    // Regex pattern for validation
    const Regex_Accept_Alpha = /^[A-Za-z\s]+$/;

    //! Handle Validation
    const handleValidation = () => {
        let isValid = true;
        const { title } = languageDetail;

        // Reset errors
        handleInputFieldError("title", "");

        if (!title.trim()) {
            handleInputFieldError("title", "Please Enter Language Name");
            isValid = false;
        } else if (!Regex_Accept_Alpha.test(title)) {
            handleInputFieldError("title", "Please Enter Valid Language Name (Only letters and spaces allowed)");
            isValid = false;
        } else if (title.length > 50) {
            handleInputFieldError("title", "Please Enter Language Name Less Than 50 Letters");
            isValid = false;
        }

        return isValid;
    };

    // API call functions
    const createLanguage = async (languageData: { languageName: string }) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/create_language`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(languageData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    };

    const updateLanguage = async (languageData: { langId: string; languageName: string }) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/update_language`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(languageData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    };

    //! Handle Submit - Creating/Updating Language
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!handleValidation()) {
            return;
        }

        setLoading(true);
        const { title } = languageDetail;

        try {
            if (editMode && languageId) {
                // Update existing language
                const result = await updateLanguage({
                    langId: languageId,
                    languageName: title.trim(),
                });

                if (result.success) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Language updated successfully!',
                        confirmButtonColor: '#3085d6',
                    });
                    router.push("/language");
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: result.message || 'Failed to update language',
                        confirmButtonColor: '#d33',
                    });
                }
            } else {
                // Create new language
                const result = await createLanguage({
                    languageName: title.trim()
                });

                if (result.success) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Language created successfully!',
                        confirmButtonColor: '#3085d6',
                    });
                    router.push("/language");
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: result.message || 'Failed to create language',
                        confirmButtonColor: '#d33',
                    });
                }
            }
        } catch (error) {
            console.error('Error submitting language:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred. Please try again.',
                confirmButtonColor: '#d33',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisplay = () => {
        router.push("/language");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="w-full mx-auto">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editMode ? 'Edit Language' : 'Add New Language'}
                            </h2>
                            <button
                                onClick={handleDisplay}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 backdrop-blur-sm"
                            >
                                Display
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {fetching ? (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center gap-2 text-gray-600">
                                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    Loading language data...
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={languageDetail.title}
                                        onChange={handleInputField}
                                        onFocus={() => handleInputFieldError("title", "")}
                                        placeholder="Enter language name"
                                        className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${inputFieldError.title
                                            ? 'border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                                            }`}
                                        disabled={loading}
                                    />
                                    {inputFieldError.title && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {inputFieldError.title}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-2">
                                        Only letters and spaces allowed. Maximum 50 characters.
                                    </p>
                                </div>

                                <div className="flex gap-3 w-20 rounded-md">
                                    <button
                                        type="submit"
                                        disabled={loading || fetching}
                                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-medium py-3 rounded-md transition-colors"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                {editMode ? 'Updating...' : 'Creating...'}
                                            </div>
                                        ) : (
                                            editMode ? 'Update' : 'Create'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ✅ Wrap with Suspense for loading fallback
const AddLanguage = () => {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen">
                    <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                    </div>
                </div>
            }
        >
            <AddLanguageReview />
        </Suspense>
    );
};

export default AddLanguage;