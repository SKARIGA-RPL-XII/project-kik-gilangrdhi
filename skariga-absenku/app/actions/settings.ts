"use server";

import { prisma } from "@/src/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(id: number, data: { nama: string; email: string }) {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        nama: data.nama,
        email: data.email,
      },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal update profil." };
  }
}

export async function changePassword(id: number, data: { oldPass: string; newPass: string }) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user || !user.password) {
      return { success: false, error: "User tidak ditemukan." };
    }

    const isMatch = await bcrypt.compare(data.oldPass, user.password);
    if (!isMatch) {
      return { success: false, error: "Password lama salah!" };
    }

    const hashedPassword = await bcrypt.hash(data.newPass, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal mengganti password." };
  }
}