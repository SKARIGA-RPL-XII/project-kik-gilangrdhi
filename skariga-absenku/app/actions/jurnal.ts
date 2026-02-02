"use server";

import { prisma } from "@/src/lib/db";
import { revalidatePath } from "next/cache";

export async function approveJurnal(id: number) {
  try {
    await prisma.jurnal.update({
      where: { id },
      data: { is_approved: true },
    });
    revalidatePath("/jurnal");
    return { success: true };
  } catch (error) {
    console.error("Approve Error:", error);
    return { success: false, error: "Gagal menyetujui jurnal." };
  }
}

export async function deleteJurnal(id: number) {
  try {
    await prisma.jurnal.delete({ where: { id } });
    revalidatePath("/jurnal");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Gagal menghapus jurnal." };
  }
}