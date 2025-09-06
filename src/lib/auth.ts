import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { allUsers } from '@/data/tickets';
import CryptoJS from 'crypto-js';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email (mock implementation)
        const user = allUsers.find(u => u.email === credentials.email);

        if (!user) {
          return null;
        }

        // In a real implementation, you'd hash the password and compare
        // For demo, we'll just check if user exists
        // Password would be hashed during registration
        // For now, accept any password for existing users

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
};