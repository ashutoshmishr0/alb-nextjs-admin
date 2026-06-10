// 'use client';
// import React, { useState, useEffect, Suspense } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Swal from "sweetalert2";

// interface RemediesDetail {
//   title: string;
//   description: string;
// }

// interface InputFieldError {
//   title: string;
//   description: string;
//   image: string;
// }

// interface ImageState {
//   file: string;
//   bytes: File | null;
// }

// function AddRemediesContent(){
//   const router = useRouter();
//   const searchParams = useSearchParams();
  
//   const editMode = searchParams.get('edit') === 'true';
//   const remedyId = searchParams.get('id');

//   const [remediesDetail, setRemediesDetail] = useState<RemediesDetail>({ 
//     title: '', 
//     description: '' 
//   });
//   const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ 
//     title: '', 
//     description: '', 
//     image: '' 
//   });
//   const [image, setImage] = useState<ImageState>({ 
//     file: '', 
//     bytes: null 
//   });
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(editMode && !!remedyId);

//   // Regex pattern for validation
//   const Regex_Accept_Alpha = /^[a-zA-Z\s]*$/;

//   // Fetch remedy data if in edit mode
//   useEffect(() => {
//     const fetchRemedyData = async () => {
//       if (editMode && remedyId) {
//         try {
//           setFetching(true);
//           const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/remedies/get_remedies/${remedyId}`);
//           const data = await response.json();
          
//           if (data.success && data.data) {
//             setRemediesDetail({
//               title: data.data.title || '',
//               description: data.data.description || ''
//             });
//           }
//         } catch (error) {
//           console.error('Error fetching remedy:', error);
//           Swal.fire({
//             icon: 'error',
//             title: 'Error!',
//             text: 'Failed to load remedy data',
//             confirmButtonColor: '#d33',
//           });
//         } finally {
//           setFetching(false);
//         }
//       }
//     };

//     fetchRemedyData();
//   }, [editMode, remedyId]);

//   //* Handle Input Field : Error
//   const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
//     setInputFieldError((prev) => ({ ...prev, [input]: value }));
//   };

//   //* Handle Input Field : Data
//   const handleInputChange = (field: keyof RemediesDetail, value: string) => {
//     setRemediesDetail(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     // Clear error when user starts typing
//     if (inputFieldError[field as keyof InputFieldError]) {
//       handleInputFieldError(field as keyof InputFieldError, '');
//     }
//   };

//   //! Handle Image : Normally
//   const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setImage({
//         file: URL.createObjectURL(e.target.files[0]),
//         bytes: e.target.files[0],
//       });
//     }
//     handleInputFieldError("image", "");
//   };

//   //! Handle Image : Drop Feature
//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       setImage({
//         file: URL.createObjectURL(e.dataTransfer.files[0]),
//         bytes: e.dataTransfer.files[0],
//       });
//     }
//     handleInputFieldError("image", "");
//   };

//   //! Handle Validation
//   const handleValidation = () => {
//     let isValid = true;
//     const { title, description } = remediesDetail;

//     if (!title.trim()) {
//       handleInputFieldError("title", "Please Enter Title");
//       isValid = false;
//     }
//     if (!Regex_Accept_Alpha.test(title)) {
//       handleInputFieldError("title", "Please Enter Valid Title (Letters only)");
//       isValid = false;
//     }
//     if (!description.trim()) {
//       handleInputFieldError("description", "Please Enter Description");
//       isValid = false;
//     }
//     if (!Regex_Accept_Alpha.test(description)) {
//       handleInputFieldError("description", "Please Enter Valid Description (Letters only)");
//       isValid = false;
//     }

//     return isValid;
//   };

//   // API call functions
//   const createRemedies = async (formData: FormData) => {
//     try {
//       const response = await fetch(`/api/admin/add-remedy`, {
//         method: 'POST',
//         body: formData,
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error creating remedy:', error);
//       throw error;
//     }
//   };

//   const updateRemedies = async (formData: FormData) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/remedies/update_remedies`, {
//         method: 'PUT',
//         body: formData,
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error updating remedy:', error);
//       throw error;
//     }
//   };

//   //! Handle Submit - Creating/Updating Remedies
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (handleValidation()) {
//       setLoading(true);
//       const { title, description } = remediesDetail;

//       try {
//         const formData = new FormData();
        
//         if (editMode && remedyId) {
//           formData.append("remedyId", remedyId);
//         }
//         formData.append("title", title);
//         formData.append("description", description);
        
//         if (image.bytes) {
//           formData.append("remedyIcon", image.bytes);
//         }

//         let result;
//         if (editMode && remedyId) {
//           result = await updateRemedies(formData);
//         } else {
//           result = await createRemedies(formData);
//         }
        
//         if (result.success) {
//           Swal.fire({
//             icon: 'success',
//             title: editMode ? 'Updated!' : 'Created!',
//             text: `Remedy ${editMode ? 'updated' : 'created'} successfully`,
//             timer: 1500,
//             showConfirmButton: false
//           });
//           setTimeout(() => {
//             router.push("/remedies");
//           }, 1600);
//         } else {
//           Swal.fire({
//             icon: 'error',
//             title: 'Error!',
//             text: result.message || `Failed to ${editMode ? 'update' : 'create'} remedy`,
//             confirmButtonColor: '#d33',
//           });
//         }
//       } catch (error) {
//         Swal.fire({
//           icon: 'error',
//           title: 'Network Error!',
//           text: 'Please check your connection and try again.',
//           confirmButtonColor: '#d33',
//         });
//         console.error('Error submitting remedy:', error);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   if (fetching) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
//           <div className="text-lg text-gray-600">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div className="text-xl font-semibold text-gray-800">
//             {editMode ? 'Edit' : 'Add'} Remedies
//           </div>
//           <button 
//             onClick={() => router.push("/remedies")}
//             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
//           >
//             Display
//           </button>
//         </div>

//         {/* Form */}
//         <div className="space-y-6">
//           {/* Title Input */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Title <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={remediesDetail.title}
//               onChange={(e) => handleInputChange('title', e.target.value)}
//               onFocus={() => handleInputFieldError("title", "")}
//               className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                 inputFieldError.title ? 'border-red-500' : 'border-gray-300'
//               }`}
//               placeholder="Enter remedy title"
//             />
//             {inputFieldError.title && (
//               <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
//             )}
//           </div>

//           {/* Description Input */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Description <span className="text-red-500">*</span>
//             </label>
//             <textarea
//               value={remediesDetail.description}
//               onChange={(e) => handleInputChange('description', e.target.value)}
//               onFocus={() => handleInputFieldError("description", "")}
//               rows={4}
//               className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                 inputFieldError.description ? 'border-red-500' : 'border-gray-300'
//               }`}
//               placeholder="Enter remedy description"
//             />
//             {inputFieldError.description && (
//               <p className="text-red-500 text-sm mt-1">{inputFieldError.description}</p>
//             )}
//           </div>

//           {/* Image Upload (Optional) */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Remedy Icon (Optional)
//             </label>
//             <div 
//               onDragOver={(e) => e.preventDefault()} 
//               onDrop={handleDrop}
//               className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
//             >
//               {image.file ? (
//                 <div className="flex flex-col items-center">
//                   <img 
//                     src={image.file} 
//                     alt="Remedy icon" 
//                     className="w-32 h-32 object-cover rounded-lg mb-2"
//                   />
//                   <p className="text-sm text-gray-600">Click or drag to change image</p>
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center">
//                   <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
//                     <span className="text-gray-500 text-2xl">+</span>
//                   </div>
//                   <p className="text-sm text-gray-600">Click or drag to upload image</p>
//                   <p className="text-xs text-gray-500 mt-1">Optional remedy icon</p>
//                 </div>
//               )}
//               <input 
//                 id="upload-image" 
//                 onChange={handleImage} 
//                 hidden 
//                 accept="image/*" 
//                 type="file" 
//               />
//             </div>
//             {inputFieldError.image && (
//               <p className="text-red-500 text-sm mt-1">{inputFieldError.image}</p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <div className="flex justify-start">
//             <button 
//               onClick={handleSubmit}
//               disabled={loading}
//               className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition duration-200 flex items-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   {editMode ? 'Updating...' : 'Creating...'}
//                 </>
//               ) : (
//                 editMode ? 'Update' : 'Create'
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// const AddRemedies = () => {
//   return (
//     <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
//       <AddRemediesContent />
//     </Suspense>
//   );
// };
// export default AddRemedies;


'use client';
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface RemediesDetail {
  title: string;
  description: string;
}

interface InputFieldError {
  title: string;
  description: string;
  image: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
}

function AddRemediesContent(){
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMode = searchParams.get('edit') === 'true';
  const remedyId = searchParams.get('id');

  const [remediesDetail, setRemediesDetail] = useState<RemediesDetail>({ 
    title: '', 
    description: '' 
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ 
    title: '', 
    description: '', 
    image: '' 
  });
  const [image, setImage] = useState<ImageState>({ 
    file: '', 
    bytes: null 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode && !!remedyId);

  // Add file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Regex pattern for validation
  const Regex_Accept_Alpha = /^[a-zA-Z\s]*$/;

  // Fetch remedy data if in edit mode
  useEffect(() => {
    const fetchRemedyData = async () => {
      if (editMode && remedyId) {
        try {
          setFetching(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/remedies/get_remedies/${remedyId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setRemediesDetail({
              title: data.data.title || '',
              description: data.data.description || ''
            });
            // If there's an existing image, set it
            if (data.data.remedyIcon) {
              setImage({
                file: `${process.env.NEXT_PUBLIC_API_URL}${data.data.remedyIcon}`,
                bytes: null
              });
            }
          }
        } catch (error) {
          console.error('Error fetching remedy:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load remedy data',
            confirmButtonColor: '#d33',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchRemedyData();
  }, [editMode, remedyId]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputChange = (field: keyof RemediesDetail, value: string) => {
    setRemediesDetail(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (inputFieldError[field as keyof InputFieldError]) {
      handleInputFieldError(field as keyof InputFieldError, '');
    }
  };

  //! Handle Image Upload Area Click
  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  //! Handle Image : Normally
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        handleInputFieldError("image", "Please select a valid image file");
        return;
      }
      setImage({
        file: URL.createObjectURL(file),
        bytes: file,
      });
      handleInputFieldError("image", "");
    }
  };

  //! Handle Image : Drop Feature
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        handleInputFieldError("image", "Please drop a valid image file");
        return;
      }
      setImage({
        file: URL.createObjectURL(file),
        bytes: file,
      });
      handleInputFieldError("image", "");
    }
  };

  //! Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  //! Handle Validation
  const handleValidation = () => {
    let isValid = true;
    const { title, description } = remediesDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title (Letters only)");
      isValid = false;
    }
    
    if (!description.trim()) {
      handleInputFieldError("description", "Please Enter Description");
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(description)) {
      handleInputFieldError("description", "Please Enter Valid Description (Letters only)");
      isValid = false;
    }

    return isValid;
  };

  // API call functions
  const createRemedies = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/add-remedy`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating remedy:', error);
      throw error;
    }
  };

  const updateRemedies = async (formData: FormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/remedies/update_remedies`, {
        method: 'PUT',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating remedy:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating Remedies
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setLoading(true);
      const { title, description } = remediesDetail;

      try {
        const formData = new FormData();
        
        if (editMode && remedyId) {
          formData.append("remedyId", remedyId);
        }
        formData.append("title", title);
        formData.append("description", description);
        
        if (image.bytes) {
          formData.append("remedyIcon", image.bytes);
        }

        let result;
        if (editMode && remedyId) {
          result = await updateRemedies(formData);
        } else {
          result = await createRemedies(formData);
        }
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: editMode ? 'Updated!' : 'Created!',
            text: `Remedy ${editMode ? 'updated' : 'created'} successfully`,
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            router.push("/remedies");
          }, 1600);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || `Failed to ${editMode ? 'update' : 'create'} remedy`,
            confirmButtonColor: '#d33',
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Network Error!',
          text: 'Please check your connection and try again.',
          confirmButtonColor: '#d33',
        });
        console.error('Error submitting remedy:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit' : 'Add'} Remedies
          </div>
          <button 
            onClick={() => router.push("/remedies")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={remediesDetail.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFieldError("title", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter remedy title"
            />
            {inputFieldError.title && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remediesDetail.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onFocus={() => handleInputFieldError("description", "")}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter remedy description"
            />
            {inputFieldError.description && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.description}</p>
            )}
          </div>

          {/* Image Upload (Optional) */}
          {/* <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Remedy Icon (Optional)
            </label>
            <div 
              onClick={handleUploadAreaClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            >
              {image.file ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={image.file} 
                    alt="Remedy icon" 
                    className="w-32 h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600">Click or drag to change image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-2xl">+</span>
                  </div>
                  <p className="text-sm text-gray-600">Click or drag to upload image</p>
                  <p className="text-xs text-gray-500 mt-1">Optional remedy icon</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                id="upload-image" 
                onChange={handleImage} 
                hidden 
                accept="image/*" 
                type="file" 
              />
            </div>
            {inputFieldError.image && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.image}</p>
            )}
          </div> */}

          {/* Submit Button */}
          <div className="flex justify-start">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editMode ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddRemedies = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddRemediesContent />
    </Suspense>
  );
};

export default AddRemedies;