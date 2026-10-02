# CrediOs

Aplicación para gestionar solicitudes de crédito.

Tecnologías principales:

- Angular 21
- NestJS
- Prisma
- PostgreSQL

## Requisitos

Antes de comenzar, se debe tener instalado:

- Node.js 20 o superior
- npm
- PostgreSQL 14 o superior

## 1. Se debe clonar e instalar el proyecto, iniciaremos instalando las dependencias en el backend

### Backend

```bash
cd backend
npm install
```

Luego se debe crear el archivo de configuración:

**Windows**

```bash
copy .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Configura la conexión a PostgreSQL dentro de env (Actualmente se encuentra configurada):

```text
backend/.env
```

Luego se debe ejecutar:

```bash
npx prisma generate
npx prisma migrate deploy
```

Luego se debe iniciar el proyecto backend, para ello usaremos:

```bash
npm run start:dev
```

La API estará disponible en:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/api/docs
```

---

## 2. Ejecutar el proyecto frontend

Abrir una segunda terminal, se instalan las dependencias y se inicia el proyecto:

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible en:

```text
http://localhost:4200
```

---

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Usuario (Solicitante) | `maria.gonzalez@test.com` | `CrediTest123!` |
| Administrador | `admin@test.com` | `AdminTest123!` |

### Usuario

Puede:

- Crear solicitudes de crédito.
- Consultar sus solicitudes.

### Administrador

Puede:

- Consultar todas las solicitudes.
- Filtrar solicitudes por estado.
- Aprobar solicitudes.
- Rechazar solicitudes.

---

## Base de datos en desarrollo

Para sincronizar rápidamente el esquema de Prisma:

```bash
cd backend
npx prisma db push
npx prisma generate
```

## Estructura del proyecto

```text
backend/    API NestJS + Prisma
frontend/   Aplicación Angular
```