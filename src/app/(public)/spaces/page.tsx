import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Space } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function SpacesCatalogPage(): Promise<React.JSX.Element> {
  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de Espacios Disponibles</h1>
        <p className="text-gray-600 mt-2">
          Explora nuestros espacios activos y reserva por horas completas (07:00 a 21:00).
        </p>
      </div>

      {spaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500 text-lg">No hay espacios activos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space: Space) => (
            <div
              key={space.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-indigo-50">
                  <Image
                    src="/space-placeholder.svg"
                    alt={space.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {space.type}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      Capacidad: {space.capacity} pers.
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{space.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{space.description}</p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-gray-900">
                    ${Number(space.pricePerHour).toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-xs"> / hora</span>
                </div>
                <Link
                  href={`/spaces/${space.id}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Ver y Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}