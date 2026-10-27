# CoSpace - Sistema Fullstack de Reservas de Espacios de Coworking

## 1. Descripción Breve
CoSpace es una plataforma web fullstack desarrollada con **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM** y **PostgreSQL (Supabase)**. Permite a los usuarios registrarse, iniciar sesión de forma segura mediante tokens en cookies `httpOnly`, explorar y reservar espacios de trabajo por horas (con un estricto motor de reglas de negocio en el backend), y a los administradores gestionar el catálogo completo.

## 2. Requisitos Previos
- **Node.js** (versión 20 o superior recomendada).
- **npm** (gestor de paquetes).
- **Docker** (opcional, para contenerización).
- Cuenta activa en **Supabase** (o base de datos PostgreSQL equivalente).

## 3. Variables de Entorno (`.env.example`)
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente estructura:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
JWT_ACCESS_SECRET="tu_secreto_access_token_muy_seguro"
JWT_REFRESH_SECRET="tu_secreto_refresh_token_muy_seguro"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

## 4. Paso a Paso de Ejecución en Desarrollo
1. Clona el repositorio en tu máquina local:
   ```bash
   git clone <url-del-repositorio>
   cd cospace
   ```
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Configura tu archivo `.env` con las credenciales de Supabase y los secretos JWT.
4. Ejecuta las migraciones de Prisma para inicializar las tablas:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Ejecuta el seed para poblar la base de datos (crea espacios iniciales y el usuario administrador):
   ```bash
   npx prisma db seed
   ```
6. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 5. Credenciales del Usuario Administrador (Generadas por el Seed)
- **Correo electrónico:** `admin@cospace.com`
- **Contraseña:** `Admin123*`
- **Correo electrónico:** `user@cospace.com`
- **Contraseña:** `User123!`

## 6. Comandos de Docker
Para construir y ejecutar la aplicación contenerizada:
1. Construir la imagen de Docker:
   ```bash
   docker build -t cospace-app .
   ```
2. Ejecutar el contenedor:
   ```bash
   docker run --env-file .env -p 3000:3000 cospace-app
   ```

## 7. Tabla de Scripts del `package.json`
- `npm run dev`: Inicia el entorno de desarrollo con Next.js.
- `npm run build`: Compila la aplicación optimizada para producción.
- `npm start`: Inicia el servidor de producción compilado.
- `npm run lint`: Ejecuta el linter de ESLint para auditoría de código.
- `npm test`: Ejecuta las pruebas unitarias del motor de reglas de negocio.

## 8. Estructura del Proyecto (Árbol de Carpetas)
```text
cospace/
├── prisma/               # Esquema de base de datos, migraciones y seed
├── src/
│   ├── app/              # App Router (Route Groups: (public), (auth), (private), (admin))
│   ├── components/       # Componentes reutilizables de UI
│   ├── context/          # Proveedores de contexto e internacionalización (i18n)
│   └── lib/              # Lógica de negocio, cliente de Prisma y utilidades de auth
├── Dockerfile            # Configuración de contenerización multi-etapa
└── README.md             # Documentación oficial
```

## 9. Enlace a la Aplicación Desplegada
- **Despliegue en Vercel:** https://cospace-29mi.vercel.app/
