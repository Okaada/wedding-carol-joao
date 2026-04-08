import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getMongoClient } from "./mongodb";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const client = await getMongoClient();
        const user = await client
          .db("carol-joao")
          .collection("admin_users")
          .findOne({ email });

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash as string);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email as string,
          name: user.name as string,
        };
      },
    }),
  ],
});
