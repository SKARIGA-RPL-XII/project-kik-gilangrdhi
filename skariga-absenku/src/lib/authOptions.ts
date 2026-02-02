import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/db"; 
import bcrypt from "bcryptjs";

interface CustomUser extends User {
  id: string;
  role: string;
  nama: string | null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.nama,
          email: user.email,
          role: user.role,
          nama: user.nama
        } as CustomUser;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | CustomUser }) {
      if (user) {
        const u = user as CustomUser;
        token.role = u.role;
        token.id = u.id;
      }
      return token;
    },
    
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const user = session.user as CustomUser;
        user.role = token.role as string;
        user.id = token.id as string;
      }
      return session;
    }
  }
};