'use client';

import { useEffect, useState } from 'react';

interface Space {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  pricePerHour: number;
  isActive: boolean;
}

export default function AdminSpacesPage(): React.JSX.Element {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Si editingSpaceId tiene valor, el formulario edita en lugar de crear
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DESK');
  const [capacity, setCapacity] = useState('4');
  const [pricePerHour, setPricePerHour] = useState('25');

  useEffect(() => {
    let isMounted = true;

    const loadSpaces = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await fetch('/api/spaces');
        const data: unknown = await res.json();

        if (!res.ok) {
          const errData = data as { error?: string };
          throw new Error(errData.error || 'Error al obtener los espacios');
        }

        if (isMounted) {
          setSpaces(data as Space[]);
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

    void loadSpaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = (): void => {
    setEditingSpaceId(null);
    setName('');
    setDescription('');
    setType('DESK');
    setCapacity('4');
    setPricePerHour('25');
  };

  const handleStartEdit = (space: Space): void => {
    setEditingSpaceId(space.id);
    setName(space.name);
    setDescription(space.description || '');
    setType(space.type);
    setCapacity(String(space.capacity));
    setPricePerHour(String(space.pricePerHour));
    setError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSpace = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const endpoint = editingSpaceId ? `/api/spaces/${editingSpaceId}` : '/api/spaces';
    const method = editingSpaceId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          capacity: parseInt(capacity, 10),
          pricePerHour: parseFloat(pricePerHour),
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errData = data as { error?: string };
        throw new Error(errData.error || 'No se pudo guardar el espacio');
      }

      setSuccessMessage(
        editingSpaceId ? 'Espacio actualizado exitosamente.' : 'Espacio creado exitosamente.'
      );
      resetForm();

      const updatedRes = await fetch('/api/spaces');
      const updatedData: unknown = await updatedRes.json();
      if (updatedRes.ok) {
        setSpaces(updatedData as Space[]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar el espacio');
      }
    }
  };

  const handleDeactivateSpace = async (id: string): Promise<void> => {
    if (!confirm('¿Deseas desactivar este espacio? (Regla 12/13)')) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/spaces/${id}/deactivate`, {
        method: 'PATCH',
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errData = data as { error?: string };
        throw new Error(errData.error || 'No se pudo desactivar el espacio');
      }

      setSuccessMessage('Espacio desactivado exitosamente.');

      const updatedRes = await fetch('/api/spaces');
      const updatedData: unknown = await updatedRes.json();
      if (updatedRes.ok) {
        setSpaces(updatedData as Space[]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al desactivar');
      }
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Espacios (Admin)</h1>
        <p className="text-gray-600 mt-2">Crea, edita o desactiva espacios de trabajo del catálogo.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
          {successMessage}
        </div>
      )}

      {/* Formulario de Creación / Edición */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {editingSpaceId ? 'Editar Espacio Existente' : 'Registrar Nuevo Espacio'}
          </h2>
          {editingSpaceId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 underline"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitSpace} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              placeholder="Ej. Sala de Juntas Norte"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Espacio</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            >
              <option value="DESK">Escritorio (DESK)</option>
              <option value="MEETING_ROOM">Sala de Reuniones (MEETING_ROOM)</option>
              <option value="PRIVATE_BOOTH">Cabina Privada (PRIVATE_BOOTH)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              placeholder="Detalles del espacio..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad (Personas)
            </label>
            <input
              type="number"
              required
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Hora ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-sm"
            >
              {editingSpaceId ? 'Guardar Cambios' : 'Crear Espacio'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Espacios Administrables */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Espacios Registrados</h2>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando espacios...</div>
      ) : spaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-500 text-lg">No hay espacios registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      space.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {space.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs font-medium text-indigo-600 mb-2">{space.type}</p>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{space.description}</p>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Precio: ${Number(space.pricePerHour).toFixed(2)} / hora
                </p>
                <p className="text-sm text-gray-500 mb-6">Capacidad: {space.capacity} pers.</p>
              </div>

              {space.isActive && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(space)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm py-2 rounded-xl transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateSpace(space.id)}
                    className="flex-1 bg-white border border-red-300 hover:bg-red-50 text-red-600 font-medium text-sm py-2 rounded-xl transition-colors"
                  >
                    Desactivar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}