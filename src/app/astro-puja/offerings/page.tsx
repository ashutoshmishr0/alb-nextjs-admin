'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MainDatatable from "@/components/common/MainDatatable";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import Swal from "sweetalert2";

interface PujaOffering {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL;

const getOfferings = async (): Promise<PujaOffering[]> => {
    try {
        const res = await fetch(`${BASE}/api/puja-new/admin/offerings`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        return data.offerings || [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

const softDelete = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE}/api/puja-new/admin/offerings/${id}`, { method: "DELETE" });
        return res.ok;
    } catch {
        return false;
    }
};

const hardDelete = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE}/api/puja-new/admin/offerings/${id}/hard`, { method: "DELETE" });
        return res.ok;
    } catch {
        return false;
    }
};

const PujaOfferingsPage: React.FC = () => {
    const router = useRouter();
    const [data, setData] = useState<PujaOffering[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const filteredData = searchText.trim()
        ? data.filter(o => JSON.stringify(o).toLowerCase().includes(searchText.toLowerCase()))
        : data;

    const fetchAll = async () => {
        setLoading(true);
        const offerings = await getOfferings();
        setData(offerings);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleEdit = (row: PujaOffering) => {
        localStorage.setItem("editOfferingData", JSON.stringify(row));
        router.push(`/astro-puja/offerings/add-offering?id=${row._id}`);
    };

    const handleDelete = async (row: PujaOffering) => {
        const result = await Swal.fire({
            title: "Delete Offering?",
            html: `
                <p class="text-gray-600 mb-3">Choose how you want to delete <b>${row.name}</b></p>
            `,
            icon: "warning",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            denyButtonColor: "#6b7280",
            cancelButtonColor: "#d1d5db",
            confirmButtonText: "Permanent Delete",
            denyButtonText: "Deactivate Only",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            const ok = await hardDelete(row._id);
            ok
                ? Swal.fire("Deleted!", `${row.name} permanently deleted.`, "success")
                : Swal.fire("Error!", "Failed to delete.", "error");
            if (ok) fetchAll();
        } else if (result.isDenied) {
            const ok = await softDelete(row._id);
            ok
                ? Swal.fire("Deactivated!", `${row.name} has been deactivated.`, "success")
                : Swal.fire("Error!", "Failed to deactivate.", "error");
            if (ok) fetchAll();
        }
    };

    const columns = [
        {
            name: "S.No.",
            selector: (_row: PujaOffering, index?: number) => (index ?? 0) + 1,
            width: "70px",
        },
        {
            name: "Image",
            cell: (row: PujaOffering) => (
                <div className="relative w-[50px] h-[50px]">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${row.image}`}
                        alt={row.name}
                        fill
                        className="rounded-lg object-cover"
                    />
                </div>
            ),
            width: "80px",
        },
        {
            name: "Name",
            selector: (row: PujaOffering) => row.name || "N/A",
            sortable: true,
            width: "200px",
        },
        {
            name: "Description",
            cell: (row: PujaOffering) => (
                <span className="text-xs text-gray-600 line-clamp-2">{row.description}</span>
            ),
            width: "260px",
        },
        {
            name: "Price",
            cell: (row: PujaOffering) => (
                <span className="text-sm font-medium text-green-700">₹{row.price}</span>
            ),
            sortable: true,
            width: "100px",
        },
        {
            name: "Order",
            selector: (row: PujaOffering) => row.sortOrder ?? 0,
            sortable: true,
            width: "90px",
        },
        {
            name: "Status",
            cell: (row: PujaOffering) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }`}>
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
            width: "100px",
        },
        {
            name: "Action",
            cell: (row: PujaOffering) => (
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => handleEdit(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Edit"
                    >
                        <EditSvg />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Delete"
                    >
                        <DeleteSvg />
                    </button>
                </div>
            ),
            width: "120px",
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <MainDatatable
                columns={columns.map(col => ({
                    ...col,
                    minwidth: col.width,
                    width: undefined,
                }))}
                title="Puja Offerings"
                data={filteredData}
                url="/astro-puja/offerings/add-offering"
                showSearch={false}
            />
        </div>
    );
};

export default PujaOfferingsPage;