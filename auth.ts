import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMemberPassword } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const member = await verifyMemberPassword(
          credentials.username as string,
          credentials.password as string
        );
        if (!member) return null;
        return {
          id: member.id,
          name: member.name,
          email: member.username,      // using email field to store username
          image: member.role,          // using image field to store role
          mustChangePassword: member.mustChangePassword ?? false,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.image;       // role stored in image field
        token.username = user.email;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes (in seconds)
    updateAge: 5 * 60, // refresh session every 5 minutes while active
  },
  jwt: {
    maxAge: 30 * 60, // 30 minutes
  },
});


