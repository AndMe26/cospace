import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth';
import LoginFormClient from '@/components/LoginFormClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      if (payload.role === 'ADMIN') {
        redirect('/admin/spaces');
      } else {
        redirect('/dashboard');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-black text-indigo-600 tracking-tight">CoSpace</h2>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Inicia sesión en tu cuenta</h1>
          <p className="mt-2 text-sm text-gray-600">
            ¿Aún no tienes cuenta?{' '}
            <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Regístrate aquí
            </a>
          </p>
        </div>

        <LoginFormClient />
      </div>
    </div>
  );
}