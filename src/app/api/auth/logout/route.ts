import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  
  // Borramos las cookies de autenticación
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  // Redirigimos al usuario a la página de login o inicio de forma limpia
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, { status: 303 });
}