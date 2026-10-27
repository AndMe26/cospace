import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/reservations/[id]/cancel
 * Cancela una reserva existente aplicando las reglas de autorización, ventana de tiempo y persistencia.
 */
export async function PATCH(request: Request, props: RouteParams): Promise<NextResponse> {
  try {
    const params = await props.params;
    const reservationId = params.id;

    // 1. Validación de Autenticación mediante cookie httpOnly
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Token de acceso inválido o expirado' }, { status: 401 });
    }

    // 2. Buscar la reserva en la base de datos
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Reglas 9 y 14: Verificar si el usuario es el dueño o es ADMIN
    const isOwner = reservation.userId === payload.userId;
    const isAdmin = payload.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar esta reserva (Regla 9/14)' },
        { status: 403 }
      );
    }

    if (reservation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La reserva ya se encuentra cancelada' },
        { status: 400 }
      );
    }

    // Regla 10: Validar la ventana de tiempo (al menos 2 horas antes del startTime)
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 2) {
      return NextResponse.json(
        { error: 'Las reservas solo pueden cancelarse con al menos 2 horas de anticipación (Regla 10)' },
        { status: 400 }
      );
    }

    // Regla 11: Actualizar el estado a CANCELLED de forma persistente sin eliminar la fila
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(
      {
        message: 'Reserva cancelada exitosamente',
        reservation: updatedReservation,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error en PATCH /api/reservations/[id]/cancel:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}