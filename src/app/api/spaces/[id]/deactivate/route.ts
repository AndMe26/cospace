import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/spaces/[id]/deactivate
 * Realiza el borrado lógico de un espacio (Regla 12) validando reservas futuras confirmadas (Regla 13).
 */
export async function PATCH(request: Request, props: RouteParams): Promise<NextResponse> {
  try {
    const params = await props.params;
    const spaceId = params.id;

    // 1. Validación de Autenticación y Rol ADMIN (401 / 403)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Token de acceso inválido o expirado' }, { status: 401 });
    }
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado: Se requiere rol ADMIN' }, { status: 403 });
    }

    // 2. Verificar que el espacio exista
    const deactivatedSpace = await prisma.$transaction(async (transaction) => {
      const space = await transaction.space.findUnique({ where: { id: spaceId } });
      if (!space) return null;

      const futureConfirmedReservations = await transaction.reservation.count({
        where: { spaceId, status: 'CONFIRMED', startTime: { gt: new Date() } },
      });
      if (futureConfirmedReservations > 0) return 'has-future-reservations' as const;

      return transaction.space.update({
        where: { id: spaceId },
        data: { isActive: false },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!deactivatedSpace) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }
    if (deactivatedSpace === 'has-future-reservations') {
      return NextResponse.json(
        { error: 'No se puede desactivar el espacio porque cuenta con reservas confirmadas con fecha futura (Regla 13).' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: 'Espacio desactivado exitosamente',
        space: deactivatedSpace,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error en PATCH /api/spaces/[id]/deactivate:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Conflicto concurrente; vuelve a intentar la operación' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}