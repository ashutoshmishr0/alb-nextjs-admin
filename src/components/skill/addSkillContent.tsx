'use client';
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface SkillDetail {
  title: string;
}

interface InputFieldError {
  title: string;
  image: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
}

const AddSkillContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMode = searchParams.get('edit') === 'true';
  const skillId = searchParams.get('id');
  const skillNameFromUrl = searchParams.get('skill');

  const [skillDetail, setSkillDetail] = useState<SkillDetail>({ 
    title: skillNameFromUrl ? decodeURIComponent(skillNameFromUrl) : '' 
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ 
    title: '', 
    image: '' 
  });
  const [image, setImage] = useState<ImageState>({ 
    file: '', 
    bytes: null 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode && !skillNameFromUrl);

  // Regex pattern for validation
  const Regex_Accept_Alpha = /^[a-zA-Z\s]*$/;

  // Fetch skill data if in edit mode
  useEffect(() => {
    const fetchSkillData = async () => {
      if (editMode && skillId && !skillNameFromUrl) {
        try {
          setFetching(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/skill/get_skill/${skillId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setSkillDetail({ title: data.data.skill || '' });
          }
        } catch (error) {
          console.error('Error fetching skill:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load skill data',
            confirmButtonColor: '#d33',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchSkillData();
  }, [editMode, skillId, skillNameFromUrl]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'title') {
      if (value.length > 40) {
        setInputFieldError({ ...inputFieldError, title: 'Maximum character limit is 40' });
        return;
      } else {
        setInputFieldError({ ...inputFieldError, title: '' });
      }
    }
    
    setSkillDetail(prev => ({ ...prev, [name]: value }));
  };

  //! Handle Image : Normally
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.target.files[0]),
        bytes: e.target.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle Image : Drop Feature
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.dataTransfer.files[0]),
        bytes: e.dataTransfer.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle Validation
  const handleValidation = () => {
    let isValid = true;
    const { title } = skillDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    }
    if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title (Letters only)");
      isValid = false;
    }
    if (title.length > 40) {
      handleInputFieldError("title", "Maximum character limit is 40");
      isValid = false;
    }

    return isValid;
  };

  // API call functions
  const createSkill = async (skillData: { skill: string }) => {
    try {
      const response = await fetch(`/api/admin/skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating skill:', error);
      throw error;
    }
  };

  const updateSkill = async (skillData: { skillId: string; skill: string }) => {
    try {
      const response = await fetch(`/api/admin/update-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating Skill
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setLoading(true);
      const { title } = skillDetail;

      try {
        let result;
        const isEdit = editMode && skillId;

        if (isEdit) {
          result = await updateSkill({
            skillId: skillId!,
            skill: title
          });
        } else {
          result = await createSkill({
            skill: title
          });
        }
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: isEdit ? 'Updated!' : 'Created!',
            text: `Skill ${isEdit ? 'updated' : 'created'} successfully`,
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            router.push("/skill");
          }, 1600);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || `Failed to ${isEdit ? 'update' : 'create'} skill`,
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
        console.error('Error submitting skill:', error);
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
          <div className="text-lg text-gray-600">Loading skill data...</div>
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
            {editMode ? 'Edit' : 'Add'} Skill
          </div>
          <button 
            onClick={() => router.push("/skill")}
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
              <span className="text-xs text-gray-500 ml-2">
                {skillDetail.title.length}/40 characters
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={skillDetail.title}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("title", "")}
              maxLength={40}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter skill title"
            />
            {inputFieldError.title && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
            )}
          </div>

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

export default AddSkillContent;