
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No se encontró el token de actualización' },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token de actualización inválido o expirado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshTokenHash) {
      return NextResponse.json(
        { error: 'Sesión revocada o usuario no encontrado' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'El token de sesión ya no es válido' },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    // Solo una petición puede sustituir el hash anterior.
    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        refreshTokenHash: user.refreshTokenHash,
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        { error: 'La sesión ya fue renovada o revocada. Inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json(
      { message: 'Sesión renovada exitosamente' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error en POST /api/auth/refresh:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor al renovar la sesión' },
      { status: 500 }
    );
  }
}
