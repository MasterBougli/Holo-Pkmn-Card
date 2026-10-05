import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getSiteSettings } from "@/lib/site-settings";
import { passwordError } from "@/lib/password-policy";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { username } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendAuthEmail } from "@/lib/mailer";
import * as authSchema from "@/lib/auth-schema";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
    ? {
        twitch: {
          clientId: process.env.TWITCH_CLIENT_ID,
          clientSecret: process.env.TWITCH_CLIENT_SECRET,
        },
      }
    : {}),
};

if (process.env.NODE_ENV === "production" && (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET doit contenir au moins 32 caractères en production.");
}

export const auth = betterAuth({
  appName: "GeeckosCollector",
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const field = ctx.path === "/sign-up/email" ? "password" : ["/reset-password", "/change-password", "/set-password"].includes(ctx.path) ? "newPassword" : null;
      if (!field) return;
      const password = ctx.body?.[field];
      if (typeof password !== "string") return;
      const message = passwordError(password);
      if (message) throw new APIError("BAD_REQUEST", { message });
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const config=await getSiteSettings();
          if(!config.registrationsEnabled)throw new APIError("FORBIDDEN",{code:"REGISTRATIONS_CLOSED",message:config.registrationMessage});
          return {data:user};
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "local-development-secret-change-before-deploy-32-chars",
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 64,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => sendAuthEmail(user.email, "Réinitialise ton mot de passe", url, "reset-password"),
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => sendAuthEmail(user.email, "Confirme ton adresse e-mail", url, "verification"),
  },
  socialProviders,
  plugins: [username({
    minUsernameLength: 4,
    maxUsernameLength: 16,
    usernameValidator: (value) => /^[A-Za-z0-9]{4,16}$/.test(value),
    usernameNormalization: (value) => value.toLowerCase(),
  })],
});
