import { NextResponse } from 'next/server';
import { SpaceType } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSpaceSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().min(5, 'La descripción es requerida'),
  type: z.nativeEnum(SpaceType),
  capacity: z.number().int().positive('La capacidad debe ser mayor a 0'),
  pricePerHour: z.number().positive('El precio por hora debe ser mayor a 0'),
  imageUrl: z.string().url('URL de imagen inválida'),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PUT /api/spaces/[id]
 * Actualiza la información de un espacio existente. Requiere autenticación y rol ADMIN.
 */
export async function PUT(request: Request, props: RouteParams): Promise<NextResponse> {
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
    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!existingSpace) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    // 3. Validar el cuerpo de la petición con Zod
    const body: unknown = await request.json();
    const result = updateSpaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    // 4. Actualizar el espacio en la base de datos
    const updatedSpace = await prisma.space.update({
      where: { id: spaceId },
      data: result.data,
    });

    return NextResponse.json(
      {
        message: 'Espacio actualizado exitosamente',
        space: updatedSpace,
      },
      { status: 200 }
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

    console.error('Error en PUT /api/spaces/[id]:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}