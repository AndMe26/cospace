import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function Navbar(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  let isLoggedIn = false;
  let isAdmin = false;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      isLoggedIn = true;
      isAdmin = payload.role === 'ADMIN';
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Marca */}
        <Link href="/" className="text-2xl font-black text-indigo-600 tracking-tight">
          CoSpace
        </Link>

        {/* Enlaces de navegación central */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/spaces" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
            Catálogo de Espacios
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
              Mis Reservas
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/spaces" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors">
              Panel Admin
            </Link>
          )}
        </nav>

        {/* Botones de autenticación de la derecha */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </form>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 text-sm font-semibold px-4 py-2 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}