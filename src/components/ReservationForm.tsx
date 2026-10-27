'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReservationFormProps {
  spaceId: string;
  pricePerHour: number;
}

export function ReservationForm({
  spaceId,
  pricePerHour,
}: Readonly<ReservationFormProps>): React.JSX.Element {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [durationHours, setDurationHours] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hoursOptions = [
    '07', '08', '09', '10', '11', '12', '13',
    '14', '15', '16', '17', '18', '19', '20',
  ];

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Selecciona una fecha válida.');
      return;
    }

    const startNum = parseInt(startHour, 10);
    const durationNum = parseInt(durationHours, 10);
    const endNum = startNum + durationNum;

    if (endNum > 21) {
      setError('La reserva no puede terminar después de las 21:00 (Regla 2).');
      return;
    }

    const endHourFormatted = String(endNum).padStart(2, '0');
    // Construir timestamps en hora de Bogotá (-05:00) en horas exactas
    const startTimeIso = `${date}T${startHour}:00:00.000-05:00`;
    const endTimeIso = `${date}T${endHourFormatted}:00:00.000-05:00`;

    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          startTime: new Date(startTimeIso).toISOString(),
          endTime: new Date(endTimeIso).toISOString(),
        }),
      });

      const data: unknown = await res.json();

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const errData = data as { error?: string };
        throw new Error(errData.error || 'No se pudo crear la reserva');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al crear la reserva');
      }
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = (parseInt(durationHours, 10) * pricePerHour).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Reservar este espacio</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Hora de inicio</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white"
          >
            {hoursOptions.map((h) => (
              <option key={h} value={h}>
                {h}:00
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Duración</label>
          <select
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white"
          >
            <option value="1">1 hora</option>
            <option value="2">2 horas</option>
            <option value="3">3 horas</option>
            <option value="4">4 horas</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm">
        <span className="text-gray-600">Total estimado:</span>
        <span className="text-lg font-extrabold text-indigo-600">${estimatedTotal}</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors text-sm disabled:opacity-50"
      >
        {loading ? 'Procesando reserva...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
}