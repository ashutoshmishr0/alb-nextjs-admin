'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

interface FormData {
    name: string;
    description: string;
    price: number;
    sortOrder: number;
    isActive: boolean;
}

const AddEditPujaOffering: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEdit = !!editId;

    const [form, setForm] = useState<FormData>({
        name: "",
        description: "",
        price: 0,
        sortOrder: 0,
        isActive: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEdit) return;
        try {
            const stored = localStorage.getItem("editOfferingData");
            if (stored) {
                const o = JSON.parse(stored);
                setForm({
                    name: o.name || "",
                    description: o.description || "",
                    price: o.price ?? 0,
                    sortOrder: o.sortOrder ?? 0,
                    isActive: o.isActive ?? true,
                });
                if (o.image) {
                    setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}${o.image}`);
                }
            }
        } catch {
        }
    }, [isEdit]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            return Swal.fire("Required", "Offering name is required.", "warning");
        }
        if (!form.description.trim()) {
            return Swal.fire("Required", "Description is required.", "warning");
        }
        if (!form.price || form.price <= 0) {
            return Swal.fire("Required", "Please enter a valid price.", "warning");
        }
        if (!isEdit && !imageFile) {
            return Swal.fire("Required", "Please upload an image.", "warning");
        }

        setSubmitting(true);

        const formData = new window.FormData();
        formData.append("name", form.name.trim());
        formData.append("description", form.description.trim());
        formData.append("price", String(form.price));
        formData.append("sortOrder", String(form.sortOrder));
        formData.append("isActive", String(form.isActive));
        if (imageFile) formData.append("image", imageFile);

        try {
            const url = isEdit
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/admin/offerings/${editId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/admin/offerings`;

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Something went wrong");
            }

            await Swal.fire(
                "Success!",
                isEdit ? "Offering updated successfully." : "Offering added successfully.",
                "success"
            );

            localStorage.removeItem("editOfferingData");
            router.push("/astro-puja/offerings");

        } catch (err: any) {
            Swal.fire("Error!", err.message || "Failed to save.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        localStorage.removeItem("editOfferingData");
        router.push("/astro-puja/offerings");
    };

    return (
        <div className="p-4 mx-auto">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    {isEdit ? "Edit Offering" : "Add Offering"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isEdit
                        ? "Update the details below. Leave image empty to keep the existing one."
                        : "Fill in the details and upload an image for this offering."}
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Offering Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Haridwar Ganga Aarti Seva"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        placeholder="e.g. Perform the divine Ganga Aarti at the ghats of Haridwar..."
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        rows={4}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                </div>

                <div className="flex gap-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-32"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Display Order
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={form.sortOrder}
                            onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-32"
                        />
                        <p className="text-xs text-gray-400">Lower number = appears first</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            form.isActive ? "bg-green-600" : "bg-gray-300"
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                form.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                    <span className="text-sm text-gray-700">
                        {form.isActive ? "Active (visible to users)" : "Inactive (hidden)"}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Image {!isEdit && <span className="text-red-500">*</span>}
                    </label>

                    {imagePreview && (
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-200">
                            <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-fit border border-dashed border-gray-300 hover:border-red-400 text-gray-500 hover:text-red-600 text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                        {imagePreview ? "Change Image" : "Upload Image"}
                    </button>
                    <p className="text-xs text-gray-400">Max 5MB. JPG, PNG, WEBP supported.</p>
                </div>

            </div>

            <div className="flex gap-3 mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                    {submitting
                        ? (isEdit ? "Updating..." : "Adding...")
                        : (isEdit ? "Update Offering" : "Add Offering")}
                </button>
                <button
                    onClick={handleCancel}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AddEditPujaOffering;