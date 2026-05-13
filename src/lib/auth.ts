import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Simple demo user store from environment variables
function getDemoUsers(): Map<string, string> {
  const users = new Map<string, string>();
  const demoUsersEnv = process.env.DEMO_USERS || 'admin@teneo.ai:admin123';
  
  demoUsersEnv.split(',').forEach((userPair) => {
    const [email, password] = userPair.split(':');
    if (email && password) {
      users.set(email.trim(), password.trim());
    }
  });
  
  return users;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@teneo.ai' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const demoUsers = getDemoUsers();
        const storedPassword = demoUsers.get(credentials.email);

        if (storedPassword && storedPassword === credentials.password) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
