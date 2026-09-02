// This file extends NextAuth types to include custom fields (id, role, username)
import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: string;
    username: string;
    mustChangePassword: boolean;
  }
}

