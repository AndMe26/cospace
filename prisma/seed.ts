import { PrismaClient, Role, SpaceType } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SeedSpace {
  name: string;
  description: string;
  type: SpaceType;
  capacity: number;
  pricePerHour: number;
  imageUrl: string;
  isActive: boolean;
}

async function main(): Promise<void> {
  console.log(" Iniciando el seed de CoSpace...");

  //  Crea el Administrador
  const adminEmail: string = "admin@cospace.com";
  const adminRawPassword: string = "Admin123!";
  const passwordHash: string = await bcrypt.hash(adminRawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: "Administrador CoSpace",
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(
    ` Administrador listo: ${admin.email} (Password: ${adminRawPassword})`,
  );

  // Crea un usuario estándar de prueba
  const userEmail: string = "user@cospace.com";
  const userRawPassword: string = "User123!";
  const userPasswordHash: string = await bcrypt.hash(userRawPassword, 10);

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      name: "Usuario Demo",
      email: userEmail,
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  });

  //  Crea catálogo inicial de espacios
  const existingSpacesCount: number = await prisma.space.count();

  if (existingSpacesCount === 0) {
    const initialSpaces: SeedSpace[] = [
      {
        name: "Escritorio Flex A1",
        description:
          "Escritorio ergonómico individual en zona abierta con iluminación natural, enchufes integrados y Wi-Fi de alta velocidad.",
        type: SpaceType.DESK,
        capacity: 1,
        pricePerHour: 10.0,
        imageUrl:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
      {
        name: "Escritorio Dedicado B2",
        description:
          "Puesto de trabajo amplio con monitor externo 4K de 27 pulgadas y silla ejecutiva en área silenciosa.",
        type: SpaceType.DESK,
        capacity: 1,
        pricePerHour: 14.0,
        imageUrl:
          "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
      {
        name: "Sala de Juntas Innovación",
        description:
          'Sala equipada con pantalla interactiva de 65", pizarra de cristal y sistema de videoconferencia para equipos medianos.',
        type: SpaceType.MEETING_ROOM,
        capacity: 8,
        pricePerHour: 35.0,
        imageUrl:
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
      {
        name: "Sala Creativa Boardroom",
        description:
          "Espacio ejecutivo insonorizado para presentaciones con clientes, directorio y sesiones de estrategia.",
        type: SpaceType.MEETING_ROOM,
        capacity: 12,
        pricePerHour: 50.0,
        imageUrl:
          "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
      {
        name: "Cabina Acústica Focus 1",
        description:
          "Cabina privada 100% insonorizada con ventilación activa, ideal para videollamadas confidenciales y concentración.",
        type: SpaceType.BOOTH,
        capacity: 1,
        pricePerHour: 15.0,
        imageUrl:
          "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
      {
        name: "Cabina Duo Pod",
        description:
          "Cabina acústica para 2 personas diseñada para sesiones rápidas de pair programming o entrevistas.",
        type: SpaceType.BOOTH,
        capacity: 2,
        pricePerHour: 22.0,
        imageUrl:
          "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
        isActive: true,
      },
    ];

    await prisma.space.createMany({
      data: initialSpaces,
    });

    console.log(` Se crearon ${initialSpaces.length} espacios de ejemplo.`);
  } else {
    console.log(
      "ℹ Ya existen espacios en la base de datos, omitiendo inserción de espacios.",
    );
  }

  console.log(" Seed finalizado con éxito.");
}

main()
  .catch((error: unknown) => {
    console.error(" Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async (): Promise<void> => {
    await prisma.$disconnect();
  });
