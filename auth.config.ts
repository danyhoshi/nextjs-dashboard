import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',//al agregar signIn: '/login'a nuestra pagesopción, el usuario será redirigido a nuestra página de inicio de sesión personalizada, en lugar de a la página predeterminada de NextAuth.js.
  },
  callbacks: {//la lógica para proteger sus rutas. Esto evitará que los usuarios accedan a las páginas del panel a menos que hayan iniciado sesión.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;