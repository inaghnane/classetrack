import { user_role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: user_role;
      firstName?: string | null;
      lastName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    role: user_role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: user_role;
    firstName?: string | null;
    lastName?: string | null;
  }
}
