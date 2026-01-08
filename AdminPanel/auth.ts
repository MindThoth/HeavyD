import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // If ALLOWED_EMAILS is set, only allow those emails
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(",").map(email => email.trim())

      if (allowedEmails && allowedEmails.length > 0) {
        if (!profile?.email) {
          return false
        }
        return allowedEmails.includes(profile.email)
      }

      // If no ALLOWED_EMAILS set, allow all Google accounts
      return true
    },
    async session({ session, token }) {
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
})
