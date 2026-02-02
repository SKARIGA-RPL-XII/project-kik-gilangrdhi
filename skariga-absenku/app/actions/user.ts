"use server";

import { prisma } from "@/src/lib/db";
import { revalidatePath } from "next/cache";

export async function approveUser(id: number) {
  try {
    await prisma.user.update({
      where: { id },
      data: { status_akun: "ACTIVE" },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Approve Error:", error);
    return { success: false, error: "Gagal mengaktifkan user." };
  }
}

export async function rejectUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Reject Error:", error);
    return { success: false, error: "Gagal menolak user." };
  }
}

export async function updateUserCompany(id: number, companyId: number) {
  try {
    await prisma.user.update({
      where: { id },
      data: { companyId },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Update Company Error:", error);
    return { success: false, error: "Gagal update perusahaan." };
  }
}