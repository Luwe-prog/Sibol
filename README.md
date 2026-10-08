# Sibol

A Field Engagement on Indoor and Rooftop Farming System with Optimization.

- [PROJECT_SCOPE.md](PROJECT_SCOPE.md): what the system does and the decisions behind it
- [docs/ERD.md](docs/ERD.md): database design
- [docs/USER_MANUAL.md](docs/USER_MANUAL.md): how Admins and Super Admins use the system
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): walk-through for the defense
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): putting it online

## Requirements

Laragon (PHP 8.3, MySQL 8.4, Composer) and Node.js 20.

## First-time setup

1. Start MySQL from Laragon ("Start All").
2. Create the database (HeidiSQL or the Laragon terminal):

   ```sql
   CREATE DATABASE sibol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Backend:

   ```
   cd backend
   composer install
   copy .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   ```

4. Frontend:

   ```
   cd frontend
   npm install
   copy .env.example .env
   ```

## Running

Start MySQL from Laragon, then open two terminals:

```
cd backend
php artisan serve
```

```
cd frontend
npm run dev
```

Open http://localhost:5173 and log in.

## Seeded Super Admin

| Email | Password |
|---|---|
| superadmin@sibol.test | password |

These come from `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `backend/.env`, read when the seeder first runs. If the password was changed in the app afterwards, the changed one applies.

## Demo data

```
cd backend
php artisan db:seed --class=DemoSeeder
```

Adds two demo farms, seven zones, about a week of readings, and two Admins (`ana@sibol.test` and `ben@sibol.test`, password `password`). It is safe to re-run: it rebuilds only the two "Demo ..." farms and leaves everything else alone. Re-run it before a demo, because the dates are counted back from today.

## Tests

```
cd backend
php artisan test
```

Tests run on an in-memory SQLite database and do not touch the MySQL data.

```
cd frontend
npm test
```

## Locked out

If no Super Admin can log in, give one a new temporary password from the terminal:

```
cd backend
php artisan sibol:reset-password superadmin@sibol.test
```

## After pulling new code

```
cd backend
php artisan migrate
```

## Resetting the database

```
cd backend
php artisan migrate:fresh --seed
```

This deletes all data and re-creates the Super Admin and the six seed crops.
