
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateReservationPeriod } from '@/lib/reservation-rules';
import { z } from 'zod';

const reservationSchema = z.object({
  spaceId: z.string().uuid('ID de espacio inválido'),
  startTime: z.string().datetime(
    'Fecha de inicio inválida (formato ISO requerido)'
  ),
  endTime: z.string().datetime(
    'Fecha de fin inválida (formato ISO requerido)'
  ),
});

/**
 * GET /api/reservations
 * Obtiene las reservas del usuario autenticado.
 * Si es ADMIN y solicita ?all=true, obtiene todas las reservas.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token de acceso inválido o expirado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get('all') === 'true';

    // Solo un administrador puede consultar todas las reservas.
    if (viewAll && payload.role === 'ADMIN') {
      const allReservations = await prisma.reservation.findMany({
        include: {
          space: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(allReservations, { status: 200 });
    }

    // Los demás usuarios solo consultan sus propias reservas.
    const userReservations = await prisma.reservation.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        space: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(userReservations, { status: 200 });
  } catch (error: unknown) {
    console.error('Error en GET /api/reservations:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Crea una reserva aplicando las reglas de negocio.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token de acceso inválido o expirado' },
        { status: 401 }
      );
    }

    // Leer el cuerpo de la petición.
    const body: unknown = await request.json();

    // Validar la estructura del JSON recibido.
    const parsedBody = reservationSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Datos de reserva inválidos',
          details: parsedBody.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      spaceId,
      startTime: startStr,
      endTime: endStr,
    } = parsedBody.data;

    const startTime = new Date(startStr);
    const endTime = new Date(endStr);
    const now = new Date();

    // Validar duración, horarios y fechas permitidas.
    const periodError = validateReservationPeriod(
      startTime,
      endTime,
      now
    );

    if (periodError) {
      return NextResponse.json(
        { error: periodError },
        { status: 400 }
      );
    }

    const durationInHours =
      (endTime.getTime() - startTime.getTime()) /
      (1000 * 60 * 60);

    // Validar disponibilidad y crear la reserva dentro de una transacción.
    const transactionResult = await prisma.$transaction(
      async (transaction) => {
        // Comprobar que el espacio exista y esté activo.
        const space = await transaction.space.findUnique({
          where: { id: spaceId },
        });

        if (!space || !space.isActive) {
          return {
            error:
              'El espacio no existe o no se encuentra activo (Regla 7)',
            status: 404,
          } as const;
        }

        // Regla 4: impedir solapamientos en el mismo espacio.
        const spaceOverlap =
          await transaction.reservation.findFirst({
            where: {
              spaceId,
              status: 'CONFIRMED',
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          });

        if (spaceOverlap) {
          return {
            error:
              'El espacio ya se encuentra reservado en el horario seleccionado (Regla 4)',
            status: 409,
          } as const;
        }

        // Regla 5: impedir solapamientos para el mismo usuario.
        const userOverlap =
          await transaction.reservation.findFirst({
            where: {
              userId: payload.userId,
              status: 'CONFIRMED',
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          });

        if (userOverlap) {
          return {
            error:
              'Ya tienes otra reserva activa que se cruza con este horario (Regla 5)',
            status: 409,
          } as const;
        }

        // Regla 6: máximo de tres reservas futuras confirmadas.
        const activeFutureReservationsCount =
          await transaction.reservation.count({
            where: {
              userId: payload.userId,
              status: 'CONFIRMED',
              startTime: { gt: now },
            },
          });

        if (activeFutureReservationsCount >= 3) {
          return {
            error:
              'Has alcanzado el límite máximo de 3 reservas activas futuras (Regla 6)',
            status: 409,
          } as const;
        }

        // Regla 8: el precio siempre se calcula desde la base de datos.
        const totalPrice =
          durationInHours * Number(space.pricePerHour);

        const reservation =
          await transaction.reservation.create({
            data: {
              userId: payload.userId,
              spaceId,
              startTime,
              endTime,
              totalPrice,
              status: 'CONFIRMED',
            },
          });

        return { reservation } as const;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Devolver los errores de las reglas de negocio.
    if ('error' in transactionResult) {
      return NextResponse.json(
        { error: transactionResult.error },
        { status: transactionResult.status }
      );
    }

    return NextResponse.json(
      {
        message: 'Reserva creada exitosamente',
        reservation: transactionResult.reservation,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // JSON mal formado: error de la petición del cliente.
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'El cuerpo de la petición debe ser un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en POST /api/reservations:', error);

    // Conflicto de concurrencia detectado por Prisma.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      return NextResponse.json(
        {
          error:
            'Conflicto concurrente; vuelve a intentar la reserva',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
