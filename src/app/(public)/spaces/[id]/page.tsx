import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ReservationForm } from '@/components/ReservationForm';

export const dynamic = 'force-dynamic';

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpaceDetailPage({
  params,
}: Readonly<SpaceDetailPageProps>): Promise<React.JSX.Element> {
  const { id } = await params;

  const space = await prisma.space.findUnique({
    where: { id },
  });

  if (!space?.isActive) {
    notFound();
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/spaces" className="text-indigo-600 hover:underline text-sm font-medium">
          &larr; Volver al catálogo de espacios
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="relative h-64 sm:h-80 w-full bg-indigo-50">
          <Image
            src="/space-placeholder.svg"
            alt={space.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>

        <div className="p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">
                {space.type}
              </span>
              <span className="text-sm font-medium text-gray-500">
                Capacidad máxima: <strong>{space.capacity} personas</strong>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{space.name}</h1>
            <p className="text-gray-600 text-base leading-relaxed mb-6">{space.description}</p>

            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold">Reglas de reserva en CoSpace:</p>
              <p>• Duración de 1 a 4 horas en bloques de hora completa.</p>
              <p>• Horario permitido: 07:00 a 21:00 (máximo 30 días de anticipación).</p>
              <p>• Cancelación gratuita hasta 2 horas antes del inicio.</p>
            </div>
          </div>

          <div>
            <ReservationForm
              spaceId={space.id}
              pricePerHour={Number(space.pricePerHour)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}