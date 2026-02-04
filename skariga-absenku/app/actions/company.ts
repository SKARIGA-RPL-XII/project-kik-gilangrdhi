"use server";

import { prisma } from "@/src/lib/db";
import { revalidatePath } from "next/cache";

interface CompanyFormInput {
  nama: string;
  deskripsi?: string;
  alamat: string;
  latitude: string | number;
  longitude: string | number;
  radius: string | number;
  jam_masuk_kantor: string;
  jam_pulang_kantor: string;
}

export async function createCompany(data: CompanyFormInput) {
  try {
    await prisma.company.create({
      data: {
        nama: data.nama,
        deskripsi: data.deskripsi,
        alamat: data.alamat,
        latitude: parseFloat(data.latitude.toString()),
        longitude: parseFloat(data.longitude.toString()),
        radius: parseFloat(data.radius.toString()),
        jam_masuk_kantor: data.jam_masuk_kantor,  
        jam_pulang_kantor: data.jam_pulang_kantor,
      },
    });
    revalidatePath("/company");
    return { success: true };
  } catch (error) {
    console.error("Create Error:", error);
    return { success: false, error: "Gagal membuat perusahaan baru" };
  }
}

export async function updateCompany(id: number, data: CompanyFormInput) {
  try {
    await prisma.company.update({
      where: { id },
      data: {
        nama: data.nama,
        deskripsi: data.deskripsi,
        alamat: data.alamat,
        latitude: parseFloat(data.latitude.toString()),
        longitude: parseFloat(data.longitude.toString()),
        radius: parseFloat(data.radius.toString()),
        jam_masuk_kantor: data.jam_masuk_kantor,  
        jam_pulang_kantor: data.jam_pulang_kantor,
      },
    });
    revalidatePath("/company");
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Gagal update data" };
  }
}

export async function deleteCompany(id: number) {
  try {
    await prisma.company.delete({ where: { id } });
    revalidatePath("/company");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Gagal menghapus data" };
  }
}