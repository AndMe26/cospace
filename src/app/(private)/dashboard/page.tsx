'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Space {
  name: string;
  type: string;
  pricePerHour: number;
}

interface Reservation {
  id: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  space: Space;
}

export default function DashboardPage(): React.JSX.Element {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReservations = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await fetch('/api/reservations');
        const data: unknown = await res.json();

        if (!res.ok) {
          const errData = data as { error?: string };
          throw new Error(errData.error || 'Error al obtener las reservas');
        }

        if (isMounted) {
          setReservations(data as Reservation[]);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error desconocido');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancelReservation = async (id: string): Promise<void> => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    setError(null);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'PATCH',
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errData = data as { error?: string };
        throw new Error(errData.error || 'No se pudo cancelar la reserva');
      }

      setActionMessage('Reserva cancelada exitosamente.');

      const updatedRes = await fetch('/api/reservations');
      const updatedData: unknown = await updatedRes.json();
      if (updatedRes.ok) {
        setReservations(updatedData as Reservation[]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cancelar');
      }
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona o cancela tus reservas (mínimo 2 horas antes de su inicio).
          </p>
        </div>
        <Link
          href="/spaces"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors self-start"
        >
          + Nueva Reserva
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando tus reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500 text-lg mb-4">No tienes reservas registradas.</p>
          <Link href="/spaces" className="text-indigo-600 font-medium hover:underline text-sm">
            Explorar espacios disponibles &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {reservation.space?.name || 'Espacio'}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      reservation.status === 'CONFIRMED'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {reservation.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Inicio:</strong> {new Date(reservation.startTime).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Fin:</strong> {new Date(reservation.endTime).toLocaleString()}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Total: ${Number(reservation.totalPrice).toFixed(2)}
                </p>
              </div>

              {reservation.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleCancelReservation(reservation.id)}
                  className="bg-white border border-red-300 hover:bg-red-50 text-red-600 font-medium text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  Cancelar Reserva
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}