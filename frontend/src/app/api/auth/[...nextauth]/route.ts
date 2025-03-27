import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google-login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: account.sub || user.id,
                            email: user.email,
                            name: user.name,
                        }),
                    });

                    if (!response.ok) {
                        console.error('Backend authentication failed');
                        return false;
                    }

                    const data = await response.json();
                    account.access_token = data.access_token;
                    return true;
                } catch (error) {
                    console.error('Error during backend authentication:', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, account }) {
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.accessToken) {
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login', // Redirect to login page on error
    },
    debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }; 