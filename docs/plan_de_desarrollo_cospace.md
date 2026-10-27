# 📋 Plan Maestro de Desarrollo: CoSpace (Next.js 16 Fullstack)

## 1. Resumen Ejecutivo del Proyecto
**CoSpace** es una plataforma web fullstack para la gestión y reserva de espacios de coworking (escritorios, salas de reuniones y cabinas) por horas. El sistema está diseñado bajo la arquitectura **App Router de Next.js 16**, utilizando **TypeScript estricto**, una base de datos relacional **PostgreSQL en Supabase** gestionada mediante un **ORM**, autenticación robusta basada en **JWT (Access y Refresh Tokens) en cookies `httpOnly`**, internacionalización (**i18n**), contenerización con **Docker** y despliegue continuo en **Vercel**.

### Estructura del repositorio
Se usa `src/` para separar el código de aplicación de la configuración y los recursos de infraestructura. Next.js 16 detecta `src/app/` y `src/proxy.ts` siempre que no permanezcan carpetas `app/` o `pages/` en la raíz.

```text
src/
  app/
    (public)/
    (auth)/
    (private)/
    (admin)/
    api/
      auth/
      reservations/
      spaces/
    layout.tsx
    page.tsx
  lib/
    auth.ts
    db.ts
  proxy.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
public/
package.json
next.config.ts
tsconfig.json
```

`prisma/`, `public/`, los archivos de configuración y los manifiestos permanecen en la raíz. El alias `@/*` en `tsconfig.json` apunta a `./src/*`. Prisma se comparte desde `src/lib/db.ts`.

**Estado de referencia (27-10-2026):** existen el esquema y una migración Prisma, el seed, las rutas API de autenticación, espacios y reservas, `src/lib/auth.ts`, `src/lib/db.ts` y `src/proxy.ts`. El comando `npm run db:seed` terminó correctamente según la sesión. La migración aplicada en Supabase y las pruebas funcionales de reglas aún deben verificarse. No se debe interpretar la presencia de código como evidencia de que pasó pruebas.

---

## 2. Criterios Críticos de Evaluación (Checklist de Supervivencia)
Antes de escribir cualquier línea de código, estas reglas deben cumplirse sin excepción para evitar penalizaciones en la rúbrica:

- [ ] **Tipado Estricto (0% `any`):** Cada variable, parámetro, respuesta de API o función no tipada descuenta **1.5%** de la nota total. Se debe mantener `"strict": true` en `tsconfig.json`.
- [ ] **Integridad Fullstack:** Prohibido consumir APIs externas. Todo dato debe provenir de la base de datos propia en Supabase a través de **Route Handlers** internos.
- [ ] **Seguridad de Sesión:** Los tokens (`accessToken` y `refreshToken`) jamás deben exponerse en el cuerpo de la respuesta (JSON) ni guardarse en `localStorage`. Deben viajar exclusivamente en cookies con las banderas `httpOnly`, `secure` y `sameSite`.
- [ ] **Autoridad del Servidor:** Todas las reglas de negocio (cálculo de precios, solapamiento de horarios, límites de reservas y permisos) se validan obligatoriamente en el backend.
- [ ] **Puntualidad en el Repositorio:** Solo se evalúan los commits subidos dentro de la ventana de 7 horas (06:00 AM – 01:00 PM).

---

## 3. Cronograma Ágil de Ejecución (7 Horas)

| Fase | Horario | Duración | Entregable del Bloque |
| :--- | :--- | :--- | :--- |
| **Fase 1** | 06:00 AM – 07:40 AM | 1h 40m | Estructura `src/`, configuración, Supabase/Prisma, migración, seed y verificación del flujo de autenticación existente. |
| **Descanso 1** | *07:40 AM – 08:00 AM* | *20 min* | *Pausa obligatoria.* |
| **Fase 2** | 08:00 AM – 09:40 AM | 1h 40m | Protección con `src/proxy.ts`, cierre de reglas de espacios y reservas, y pruebas de aceptación del backend. |
| **Descanso 2** | *09:40 AM – 10:00 AM* | *20 min* | *Pausa obligatoria.* |
| **Fase 3** | 10:00 AM – 11:40 AM | 1h 40m | Route Groups, Layouts, Vistas (SSG, SSR, CSR), Internacionalización (ES/EN) e Hidratación. |
| **Descanso 3** | *11:40 AM – 12:00 PM* | *20 min* | *Pausa obligatoria.* |
| **Fase 4** | 12:00 PM – 01:00 PM | 1h 00m | Dockerfile, Despliegue en Vercel, Auditoría TypeScript, Redacción del `README.md` y Entrega. |

---

## 4. Desglose Técnico Paso a Paso

### Fase 1: Infraestructura, Datos y Autenticación (06:00 AM - 07:40 AM)

#### 4.1. Configuración Inicial y Dependencias
- [x] Proyecto existente: Next.js 16, TypeScript, Tailwind CSS y App Router. No volver a ejecutar `create-next-app` sobre el repositorio.
- [x] Dependencias existentes: Prisma, `jose`, `bcryptjs` y Zod.
- [x] Mover `app/` a `src/app/`, `lib/` a `src/lib/` y `proxy.ts` a `src/proxy.ts`, sin conservar copias de aplicación en la raíz.
- [x] Actualizar el alias `@/*` en `tsconfig.json` a `./src/*`; regenerar los route types de Next después del traslado.
- [x] Mantener Prisma y los recursos estáticos fuera de `src/`; compartir el cliente mediante `src/lib/db.ts`.
- [x] `.env.example` lista variables sin credenciales reales e incluye `DIRECT_URL`, requerida por `schema.prisma`:
  ```env
  DATABASE_URL=
  DIRECT_URL=
  JWT_ACCESS_SECRET=
  JWT_REFRESH_SECRET=
  ACCESS_TOKEN_EXPIRES_IN=15m
  REFRESH_TOKEN_EXPIRES_IN=7d
  ```
- [x] Faltar secretos JWT o que tengan menos de 32 caracteres genera un error explícito; se eliminaron los secretos de respaldo. La duración de JWT y cookies usa las variables de expiración.

#### 4.2. Diseño del Modelo Relacional y Seed
- [x] Esquema Prisma existente en `prisma/schema.prisma`. Documentar el modelo real: `User` almacena `refreshTokenHash`; `Space.pricePerHour` y `Reservation.totalPrice` son `Decimal`; los modelos incluyen fechas de creación/actualización, relaciones, estados e índices.
- [x] Migración inicial presente en `prisma/migrations/20261027133637_init/`.
- [x] `npx prisma migrate status` confirma que la base Supabase está al día con la migración existente. En desarrollo usar `prisma migrate dev`; en despliegue usar `prisma migrate deploy`.
- [x] Seed existente en `prisma/seed.ts`: crea un administrador, un usuario de prueba y seis espacios si el catálogo está vacío. El seed se ejecutó correctamente en el entorno de desarrollo.
- [ ] Evitar credenciales de administrador fijas en código para ambientes compartidos o producción; documentar y controlar las credenciales de demostración sin publicar secretos reales.

#### 4.3. Flujo de Autenticación y Autorización
Los cuatro Route Handlers ya existen bajo `app/api/auth/`; después del traslado quedarán bajo `src/app/api/auth/`.
- [x] `POST /api/auth/register`: valida con Zod, hashea la contraseña, fuerza rol `USER` y devuelve `409` si el correo ya existe.
- [x] `POST /api/auth/login`: verifica contraseña, crea ambos tokens, persiste hasheado el refresh token y los envía en cookies; no devuelve los tokens en JSON.
- [x] `POST /api/auth/refresh`: valida firma y hash persistido, y renueva el access token.
- [x] `POST /api/auth/logout`: revoca el hash y limpia las cookies.
- [ ] Verificar manualmente el flujo completo y los códigos/casos de error: datos inválidos, credenciales incorrectas, renovación válida, renovación revocada y logout.
- [ ] Confirmar cookies `httpOnly`, `secure` en producción y `sameSite`; probar localmente sin exigir `secure` en HTTP de desarrollo.
- [ ] Revisar expiraciones configurables y exigir secretos fuertes en producción antes de considerar autenticación cerrada.

---

### Fase 2: Protección de Rutas y Motor de Reglas de Negocio (08:00 AM - 09:40 AM)

#### 4.4. Protección con `proxy.ts`
- [x] `proxy.ts` existente protege `/dashboard` y `/admin`, valida el access token y bloquea a usuarios que no sean `ADMIN` en `/admin`.
- [ ] Tras moverlo, mantenerlo como `src/proxy.ts`. Los route groups no aparecen en la URL; proteger por los paths reales (`/dashboard`, `/admin`), no por nombres como `(private)`.
- [ ] Mantener autorización dentro de cada Route Handler. El proxy mejora la navegación, pero no sustituye la verificación de sesión y rol en el servidor.

#### 4.5. Route Handlers de Espacios (`src/app/api/spaces/`)
- [x] `GET /api/spaces`: devuelve activos por defecto; `all=true` solo devuelve inactivos/todos si el token válido pertenece a `ADMIN` (**Regla 12**).
- [x] `POST /api/spaces` y `PUT /api/spaces/[id]`: validan sesión y rol `ADMIN`, validan entrada con Zod y escriben en la base.
- [x] `PATCH /api/spaces/[id]/deactivate`: conserva el registro, bloquea con `409` si encuentra reservas futuras confirmadas y cambia `isActive` a `false` (**Reglas 12 y 13**).
- [x] `PUT` queda definido como reemplazo completo y no acepta `isActive`; la desactivación solo se realiza por la ruta que aplica la Regla 13.
- [ ] Probar acceso no autenticado, usuario `USER`, `ADMIN`, espacio inexistente y espacio con/sin reservas futuras.

#### 4.6. Route Handlers de Reservas (`src/app/api/reservations/`)
- [x] `GET /api/reservations`: valida la sesión y devuelve por defecto las reservas del usuario autenticado (**Regla 14**). El handler actual añade `?all=true` para administradores; es una extensión no exigida explícitamente. Mantenerla solo si se desea como comportamiento adicional y documentar el límite de autorización.
- [x] `POST /api/reservations`: implementa validaciones de las reglas 1 a 8:
  1. **Espacio Activo (Regla 7):** Verifica que el espacio exista y tenga `isActive === true`.
  2. **Bloques Exactos y Duración (Regla 1):** Verifica que los minutos y segundos de inicio y fin sean `00`, y que la diferencia `(endTime - startTime)` sea un número entero entre **1 y 4 horas**.
  3. **Horario Operativo (Regla 2):** Verifica que la hora de inicio sea $\ge 07:00$ y la hora de finalización sea $\le 21:00$. Antes de cerrar la fase, decidir y documentar la zona horaria del coworking; no dejar implícito que el horario comercial es UTC.
  4. **Ventana Temporal (Regla 3):** Verifica que `startTime` sea mayor a la fecha/hora actual y no supere los 30 días en el futuro.
  5. **Disponibilidad del Espacio (Regla 4):** Busca reservas `CONFIRMED` en ese mismo `spaceId` donde se cumpla `existing.startTime < newEndTime` **Y** `existing.endTime > newStartTime`. Esta desigualdad estricta permite que una reserva termine a las 12:00 y otra inicie exactamente a las 12:00. Si hay cruce, retorna `409 Conflict`.
  6. **Disponibilidad del Usuario (Regla 5):** Aplica la misma consulta de cruce de horarios pero filtrando por el `userId` actual en cualquier espacio. Si hay cruce, retorna `409 Conflict`.
  7. **Límite de Reservas Activas (Regla 6):** Cuenta cuántas reservas `CONFIRMED` futuras tiene el usuario. Si el conteo es $\ge 3$, rechaza con `400 Bad Request` o `409 Conflict`.
  8. **Cálculo en Servidor (Regla 8):** Calcula $\text{totalPrice} = \text{durationInHours} \times \text{space.pricePerHour}$ en el backend e inserta el registro.
- [x] `PATCH /api/reservations/[id]/cancel`:
  1. **Autorización (Reglas 9 y 14):** Verifica que la reserva pertenezca al usuario autenticado o que el usuario tenga rol `ADMIN`. De lo contrario, responde con `403 Forbidden`.
  2. **Ventana de Cancelación (Regla 10):** Verifica que falten al menos **2 horas** para el `startTime` de la reserva. Si falta menos tiempo, rechaza con `400 Bad Request`.
  3. **Persistencia (Regla 11):** Actualiza el estado a `CANCELLED` sin eliminar la fila de la base de datos.
- [x] Comprobaciones de disponibilidad, límite y creación se agrupan en una transacción serializable; conflictos de serialización responden `409`.
- [x] Reserva y desactivación se ejecutan con aislamiento serializable para detectar conflictos concurrentes en la comprobación de actividad/reservas.
- [x] La regla de horario se evalúa en `America/Bogota`; el cliente debe enviar instantes ISO y la UI debe presentarlos en esa misma zona.
- [x] Pruebas unitarias de horario, horas exactas y ventana de anticipación añadidas en `src/lib/reservation-rules.test.ts` y ejecutables con `npm test`.
- [ ] Probar por integración el solapamiento por espacio/usuario, horas adyacentes, máximo de tres reservas, precio de servidor, cancelación, permisos por ID y concurrencia contra PostgreSQL.
- [ ] Estandarizar los cuerpos de error y revisar los códigos `400`, `401`, `403`, `404` y `409` requeridos por el enunciado.

#### Criterio de salida de la Fase 2
Verificaciones ejecutadas en esta revisión: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` (5 pruebas, todas aprobadas) y `npx prisma migrate status` (esquema Supabase al día). El build ya no presenta la advertencia de Tailwind/PostCSS tras configurar `@tailwindcss/postcss`. La cobertura actual es unitaria para las reglas temporales; faltan pruebas de integración y el caso concurrente.

No iniciar la Fase 3 hasta agregar/ejecutar pruebas de aceptación de las reglas de negocio que dependen de la base de datos, incluido un caso concurrente. Registrar qué pruebas se ejecutaron y su resultado; no marcar como completado solo porque existe el endpoint.

---

### Fase 3: Arquitectura Frontend, Estrategias de Renderizado e i18n (10:00 AM - 11:40 AM)

#### 4.7. Organización de Route Groups y Layouts
Estructurar `src/app/` utilizando los cuatro grupos requeridos sin alterar las URLs finales:
- [ ] **`(public)`**: Incluye un Layout con barra de navegación pública, selector de idioma y pie de página.
  - `/` (**Home - SSG**): Página informativa pre-renderizada estáticamente en tiempo de compilación.
  - `/spaces` (**Catálogo - SSR**): Renderizado dinámico en cada petición (`force-dynamic`), mostrando tarjetas optimizadas con `next/image`.
  - `/spaces/[id]` (**Detalle - SSR**): Ruta dinámica que carga los detalles del espacio en el servidor e integra el formulario interactivo de reserva.
- [ ] **`(auth)`**: Incluye un Layout minimalista y centrado en pantalla para `/login` y `/register`.
- [ ] **`(private)`**: Incluye un Layout con barra superior, nombre/menú del usuario y botón de cierre de sesión.
  - `/dashboard` (**Mis Reservas - CSR**): Componente cliente (`"use client"`) que obtiene las reservas del usuario, gestiona la renovación silenciosa del token si expira y permite cancelar reservas activas.
- [ ] **`(admin)`**: Incluye un Layout tipo panel de control lateral o superior exclusivo para gestión.
  - `/admin`: Interfaz para listar todos los espacios, crear nuevos, editar existentes y desactivar espacios disponibles.

#### 4.8. Internacionalización (i18n) y Prevención de Errores de Hidratación
- [ ] **Soporte Multilingüe (ES / EN):** Crear un proveedor de contexto tipado (`LanguageProvider`) con diccionarios estructurados en español e inglés, accesible desde un selector visible en la barra de navegación.
- [ ] **Hidratación Segura:** Implementar un componente de reloj o indicador de zona horaria local del cliente utilizando el patrón de montaje seguro (`useEffect` + bandera booleana `isMounted`) para asegurar que el HTML inicial del servidor coincida con el primer renderizado del cliente sin lanzar advertencias de hidratación.

---

### Fase 4: Docker, Despliegue, Documentación y Entrega (12:00 PM - 01:00 PM)

#### 4.9. Contenerización con Docker
- [ ] Crear un `Dockerfile` optimizado en la raíz del proyecto que permita construir la aplicación (`npm run build`) y ejecutar el servidor de producción exponiendo el puerto `3000` e inyectando las variables de entorno en tiempo de ejecución.

#### 4.10. Auditoría de Calidad y Despliegue en Vercel
- [ ] Ejecutar `npx tsc --noEmit` para certificar que existen **0 errores de tipos** y ninguna instancia de `any`.
- [ ] Subir el código al repositorio público de GitHub.
- [ ] Importar el proyecto en **Vercel**, configurar las variables de entorno conectadas a Supabase y verificar en vivo el flujo completo (Login Admin, Creación de Espacio, Registro de Usuario, Reserva y Cancelación).

#### 4.11. Estructura Obligatoria del `README.md`
Redactar el archivo `README.md` asegurando que incluya exactamente los 9 puntos evaluables:
1. [ ] **Descripción breve del proyecto.**
2. [ ] **Requisitos previos:** Versiones de Node.js, gestor de paquetes, Docker y cuenta de Supabase.
3. [ ] **Variables de entorno:** Tabla explicativa de cada variable de `.env.example`, su propósito y cómo obtenerla/generarla.
4. [ ] **Guía de ejecución en desarrollo (paso a paso):**
   - Clonar repositorio e instalar dependencias.
   - Configurar `.env` desde `.env.example`.
   - Ejecutar migraciones del ORM.
   - Ejecutar el script de seed.
   - Iniciar servidor de desarrollo.
5. [ ] **Credenciales de acceso del Administrador** creadas por el seed.
6. [ ] **Instrucciones de ejecución con Docker:** Comandos exactos de `docker build` y `docker run` pasando las variables de entorno.
7. [ ] **Scripts disponibles:** Explicación de cada comando definido en `package.json`.
8. [ ] **Arquitectura de carpetas:** Árbol del directorio `src/` con una breve descripción de su organización.
9. [ ] **Enlace de producción:** URL pública y funcional de la aplicación desplegada en Vercel.