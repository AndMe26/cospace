import { NextResponse } from 'next/server';
import { SpaceType } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const spaceSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().min(5, 'La descripción es requerida'),
  type: z.nativeEnum(SpaceType),
  capacity: z.number().int().positive('La capacidad debe ser mayor a 0'),
  pricePerHour: z.number().positive('El precio por hora debe ser mayor a 0'),
  imageUrl: z.string().url('URL de imagen inválida'),
});

/**
 * GET /api/spaces
 * Retorna los espacios activos para el catálogo público (Regla 12).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    // Si se solicita 'all=true', validamos si es administrador
    if (includeInactive) {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken);
        if (payload?.role === 'ADMIN') {
          const allSpaces = await prisma.space.findMany({
            orderBy: { createdAt: 'desc' },
          });
          return NextResponse.json(allSpaces, { status: 200 });
        }
      }
    }

    // Regla 12 por defecto: Solo espacios con isActive: true
    const activeSpaces = await prisma.space.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(activeSpaces, { status: 200 });
  } catch (error: unknown) {
    console.error('Error en GET /api/spaces:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/spaces
 * Solo Administradores: Crea un nuevo espacio en el sistema.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    const body: unknown = await request.json();
    const result = spaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de espacio inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    const newSpace = await prisma.space.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        capacity: data.capacity,
        pricePerHour: data.pricePerHour,
        imageUrl: data.imageUrl,
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: 'Espacio creado exitosamente', space: newSpace },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Si el JSON enviado está mal formado, es un error del cliente.
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'El cuerpo de la petición debe ser un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en POST /api/spaces:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}