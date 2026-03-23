# Fix it! - Plataforma de Outsourcing

Bienvenido al repositorio de **Fix it!**, una plataforma para conectar clientes con profesionales de servicios.

## Requisitos Previos

-   [Node.js](https://nodejs.org/) (v16 o superior)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop) (para la base de datos)

## Instrucciones de Ejecución

Para correr el proyecto completo, necesitarás **3 terminales** abiertas.

### 1. Base de Datos (Docker)

Primero, levanta el contenedor de PostgreSQL con Docker Compose desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto iniciará una base de datos PostgreSQL en el puerto `5432`.

### 2. Backend (NestJS)

Abre una **nueva terminal** y navega a la carpeta del backend:

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar Base de Datos (Correr migraciones de Prisma)
npx prisma migrate dev

# 3. Iniciar el servidor en modo desarrollo
npm run start:dev
```

El backend estará corriendo en: `http://localhost:3000`

> **Nota:** Asegúrate de que tu archivo `.env` en `backend/` tenga la URL de conexión correcta a la base de datos:
> `DATABASE_URL="postgresql://postgres:password@localhost:5432/outsourcing_db?schema=public"`

### 3. Frontend (React + Vite)

Abre una **tercera terminal** y navega a la carpeta del frontend:

```bash
cd frontend

# 1. Instalar dependencias
npm install
# 2. Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173` (o el puerto que indique la consola).

---

## Estructura del Proyecto

-   `/backend`: API REST construida con NestJS y Prisma.
-   `/frontend`: Interfaz de usuario construida con React, Vite y TailwindCSS.
-   `docker-compose.yml`: Configuración de la base de datos PostgreSQL.
