// components/astrologer/MediaGallery.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, X, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';
interface MediaGalleryProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function MediaGallery({
  astrologerId,
  initialData,
  onUpdate,
}: MediaGalleryProps) {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>(
    initialData?.profileImage
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.profileImage}`
      : "",
  );

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [deletedVideos, setDeletedVideos] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // 2. handleProfileImageChange ko replace karo
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setCropImageSrc(objectUrl);
      setCropperOpen(true);

      e.target.value = "";
    }
  };

  const handleCropComplete = (blob: Blob) => {
    const croppedFile = new File([blob], "profile.jpg", { type: "image/jpeg" });
    setProfileImage(croppedFile);
    setProfilePreview(URL.createObjectURL(blob));
    setCropperOpen(false);
    URL.revokeObjectURL(cropImageSrc);
  };

  const handleMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }
      setNewImages((prev) => [...prev, file]);
      setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
    }
  };

  const handleMultipleVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > 30 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 30MB`);
        continue;
      }
      setNewVideos((prev) => [...prev, file]);
      setVideoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index: number) => {
    setNewVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const markExistingImageForDeletion = (imagePath: string) => {
    const imageName = imagePath.split("/").pop() || "";
    setDeletedImages((prev) => [...prev, imageName]);
  };

  const markExistingVideoForDeletion = (videoPath: string) => {
    const videoName = videoPath.split("/").pop() || "";
    setDeletedVideos((prev) => [...prev, videoName]);
  };

  const handleSubmit = async () => {
    if (
      !profileImage &&
      newImages.length === 0 &&
      newVideos.length === 0 &&
      deletedImages.length === 0 &&
      deletedVideos.length === 0
    ) {
      toast.info("No changes to save");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("astrologerId", astrologerId);

    // Add all existing fields from initialData
    if (initialData) {
      formData.append("astrologerName", initialData.astrologerName || "");
      formData.append("displayName", initialData.displayName || "");
      formData.append("title", initialData.title || "");
      formData.append("email", initialData.email || "");
      formData.append("phoneNumber", initialData.phoneNumber || "");
      formData.append("alternateNumber", initialData.alternateNumber || "");
      formData.append(
        "country_phone_code",
        initialData.country_phone_code || "91",
      );
      formData.append("gender", initialData.gender || "");
      formData.append("dateOfBirth", initialData.dateOfBirth || "");
      formData.append("address", initialData.address || "");
      formData.append("country", initialData.country || "India");
      formData.append("state", initialData.state || "");
      formData.append("city", initialData.city || "");
      formData.append("zipCode", initialData.zipCode || "");
      formData.append("password", initialData.password || "");
      formData.append(
        "confirm_password",
        initialData.confirm_password || initialData.password || "",
      );
      formData.append("experience", initialData.experience || "");
      formData.append("about", initialData.about || "");
      formData.append("short_bio", initialData.short_bio || "");
      formData.append("long_bio", initialData.long_bio || "");
      formData.append("youtubeLink", initialData.youtubeLink || "");
      formData.append("tagLine", initialData.tagLine || "");
      formData.append(
        "workingOnOtherApps",
        initialData.workingOnOtherApps || "No",
      );
      formData.append("consultation", initialData.consultation || "1000");
      formData.append("free_min", initialData.free_min || "0");

      (initialData.language || []).forEach((lang: string) => {
        formData.append("language", lang);
      });

      (initialData.skill || []).forEach((s: any) => {
        formData.append("skill", s._id || s);
      });
      (initialData.mainExpertise || []).forEach((e: any) => {
        formData.append("mainExpertise", e._id || e);
      });
      (initialData.remedies || []).forEach((r: any) => {
        formData.append("remedies", r._id || r);
      });

      formData.append(
        "account_holder_name",
        initialData.account_holder_name || "",
      );
      formData.append("account_number", initialData.account_number || "");
      formData.append("account_type", initialData.account_type || "");
      formData.append("IFSC_code", initialData.IFSC_code || "");
      formData.append("account_name", initialData.account_name || "");
      formData.append("panCard", initialData.panCard || "");
      formData.append("aadharNumber", initialData.aadharNumber || "");

      formData.append("chat_price", initialData.chat_price || "");
      formData.append("call_price", initialData.call_price || "");
      formData.append("video_call_price", initialData.video_call_price || "0");
      formData.append(
        "normal_video_call_price",
        initialData.normal_video_call_price || "0",
      );
      formData.append(
        "consultation_commission",
        initialData.consultation_commission || "0",
      );
      formData.append(
        "commission_call_price",
        initialData.commission_call_price || "0",
      );
      formData.append(
        "commission_chat_price",
        initialData.commission_chat_price || "0",
      );
      formData.append(
        "commission_video_call_price",
        initialData.commission_video_call_price || "0",
      );
      formData.append(
        "commission_normal_video_call_price",
        initialData.commission_normal_video_call_price || "0",
      );
      formData.append("gift_commission", initialData.gift_commission || "0");
      formData.append("follower_count", initialData.follower_count || "0");
      formData.append(
        "totalCallDuration",
        initialData.totalCallDuration || "0",
      );
      formData.append(
        "totalChatDuration",
        initialData.totalChatDuration || "0",
      );
      formData.append(
        "totalVideoCallDuration",
        initialData.totalVideoCallDuration || "0",
      );
      formData.append("currency", initialData.currency || "INR");
      formData.append("isDealInReport", initialData.isDealInReport || "false");

      (initialData.reportTypes || []).forEach((rt: string) => {
        formData.append("reportTypes", rt);
      });
    }

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    newImages.forEach((img) => {
      formData.append("multipleImages", img);
    });

    newVideos.forEach((vid) => {
      formData.append("multipleVideos", vid);
    });

    if (deletedImages.length > 0) {
      formData.append("deletedImages", JSON.stringify(deletedImages));
    }
    if (deletedVideos.length > 0) {
      formData.append("deletedVideos", JSON.stringify(deletedVideos));
    }

    try {
      const response = await fetch(
        `/api/admin/update-astrologer`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Media updated successfully");
        setProfileImage(null);
        setNewImages([]);
        setNewVideos([]);
        setImagePreviews([]);
        setVideoPreviews([]);
        setDeletedImages([]);
        setDeletedVideos([]);
        onUpdate();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const existingImages =
    initialData?.multipleImages?.filter((img: string) => {
      const imgName = img.split("/").pop() || "";
      return !deletedImages.includes(imgName);
    }) || [];

  const existingVideos =
    initialData?.multipleVideos?.filter((vid: string) => {
      const vidName = vid.split("/").pop() || "";
      return !deletedVideos.includes(vidName);
    }) || [];

  return (
    <div className="space-y-6">
      {cropperOpen && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setCropperOpen(false);
            URL.revokeObjectURL(cropImageSrc);
          }}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Image */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Profile Image
          </h3>

          <div className="flex items-center gap-4">
            {profilePreview ? (
              <div className="relative">
                <img
                  src={profilePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProfileImage(null);
                    setProfilePreview(
                      initialData?.profileImage
                        ? `${process.env.NEXT_PUBLIC_IMAGE_URL}${initialData.profileImage}`
                        : "",
                    );
                  }}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            <label className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm">
                <Upload className="w-4 h-4" />
                <span className="font-medium">Choose New</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Max 5MB, 500x500px recommended
          </p>
        </div>

        {/* Gallery Images */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Gallery Images
            </h3>
            <label className="cursor-pointer">
              <div className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                <Upload className="w-3 h-3" />
                <span>Add</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImages}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {existingImages.map((img: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${img}`}
                  alt={`${index + 1}`}
                  className="w-full h-16 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => markExistingImageForDeletion(img)}
                  className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`New ${index + 1}`}
                  className="w-full h-16 object-cover rounded border-2 border-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Max 5MB per image</p>
        </div>
      </div>

      {/* Gallery Videos */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Gallery Videos
          </h3>
          <label className="cursor-pointer">
            <div className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
              <Video className="w-3 h-3" />
              <span>Add</span>
            </div>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleMultipleVideos}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingVideos.map((vid: string, index: number) => (
            <div key={index} className="relative group">
              <video controls className="w-full h-24 object-cover rounded">
                <source src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${vid}`} />
              </video>
              <button
                type="button"
                onClick={() => markExistingVideoForDeletion(vid)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {videoPreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <video
                controls
                className="w-full h-24 object-cover rounded border-2 border-green-500"
              >
                <source src={preview} />
              </video>
              <button
                type="button"
                onClick={() => removeNewVideo(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Max 30MB per video</p>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
        >
          {submitting ? "Uploading..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
