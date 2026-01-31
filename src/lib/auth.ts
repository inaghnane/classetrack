import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient, Prisma, user_role } from "@prisma/client";
import bcrypt from "bcryptjs";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: user_role;
  passwordHash: string;
};

const prisma = new PrismaClient();
const isDev = process.env.NODE_ENV === "development";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          if (isDev) console.log("❌ AUTH: Missing credentials");
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        try {
          const rows = await prisma.$queryRaw<UserRow[]>(
            Prisma.sql`SELECT id, email, firstName, lastName, role, passwordHash FROM user WHERE email = ${email} LIMIT 1`
          );

          const user = rows[0];

          if (!user) {
            if (isDev) console.log("❌ AUTH: User not found:", email);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            if (isDev) console.log("❌ AUTH: Password mismatch");
            return null;
          }

          if (isDev) console.log("✅ AUTH: Login success:", email);

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        } catch (error) {
          if (isDev) console.error("❌ AUTH: Error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return await getServerSession(authOptions);
}
