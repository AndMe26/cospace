import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

/**
 * Proxy de Intercepción y Seguridad (Next.js 16)
 * Valida la autenticación por cookies httpOnly y protege las rutas privadas y de administrador.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Detectar si la ruta requiere protección de administrador o de usuario autenticado
  const isAdminRoute = pathname.startsWith('/admin');
  const isPrivateCustomerRoute = pathname.startsWith('/dashboard');

  if (isAdminRoute || isPrivateCustomerRoute) {
    const accessToken = request.cookies.get('accessToken')?.value;

    // Si no hay token de acceso, redirigir inmediatamente al login
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar la validez criptográfica del token de acceso
    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validar control de acceso basado en roles (RBAC) para la sección administrativa
    if (isAdminRoute && payload.role !== 'ADMIN') {
      // Si un usuario común intenta entrar a /admin, redirigirlo a su dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configuración de los matchers para el proxy
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};