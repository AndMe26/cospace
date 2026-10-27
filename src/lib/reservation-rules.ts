export const BUSINESS_TIME_ZONE = 'America/Bogota';

function getBusinessTimeParts(date: Date): { date: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value])
  ) as Record<string, string>;

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}


export function validateReservationPeriod(
  startTime: Date,
  endTime: Date,
  now: Date
): string | null {
  // Regla 1: la reserva debe iniciar y terminar en horas exactas.
  if (
    startTime.getUTCMinutes() !== 0 ||
    startTime.getUTCSeconds() !== 0 ||
    startTime.getUTCMilliseconds() !== 0 ||
    endTime.getUTCMinutes() !== 0 ||
    endTime.getUTCSeconds() !== 0 ||
    endTime.getUTCMilliseconds() !== 0
  ) {
    return 'Las reservas deben iniciar y finalizar en horas en punto (Regla 1)';
  }

  // Regla 1: la duración debe estar entre 1 y 4 horas.
  const durationInHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  if (
    durationInHours < 1 ||
    durationInHours > 4 ||
    !Number.isInteger(durationInHours)
  ) {
    return 'La duración de la reserva debe ser un número entero entre 1 y 4 horas (Regla 1)';
  }

  // Regla 3: la reserva debe ser futura y no superar 30 días.
  const maxFutureDate = new Date(now);
  maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 30);

  if (startTime <= now) {
    return 'La reserva debe ser para el futuro (Regla 3)';
  }

  if (startTime > maxFutureDate) {
    return 'La reserva no puede superar los 30 días de anticipación (Regla 3)';
  }

  // Regla 2: comprobar el horario de operación en Bogotá.
  const startBusinessTime = getBusinessTimeParts(startTime);
  const endBusinessTime = getBusinessTimeParts(endTime);

  if (
    startBusinessTime.date !== endBusinessTime.date ||
    startBusinessTime.hour < 7 ||
    endBusinessTime.hour > 21
  ) {
    return `El horario operativo permitido es de 07:00 a 21:00 ${BUSINESS_TIME_ZONE} (Regla 2)`;
  }

  return null;
}
