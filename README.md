# Sibol

A Field Engagement on Indoor and Rooftop Farming System with Optimization.

Sibol is a website for small indoor and rooftop farms. An Admin types in the soil moisture, temperature and humidity of a growing area. Sibol compares them with the ideal ranges of the crop and reports whether the soil is **Too Dry**, **Optimal** or **Too Wet**, what to do about it, and how many liters of water to apply.

## Start here

| Document | What it covers |
|---|---|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Installing and running Sibol on a new computer |
| [docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md) | What the system does, and what each role can do |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | Step-by-step instructions for Admins and Super Admins |
| [docs/ERD.md](docs/ERD.md) | Database design |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Putting it online (not done yet) |
| [PROJECT_SCOPE.md](PROJECT_SCOPE.md) | The scope and the decisions behind the design |

## Folders

| Folder | Contents |
|---|---|
| `backend/` | Laravel 12 API and the MySQL database migrations and seeders |
| `frontend/` | React pages (Vite, Tailwind CSS) |
| `docs/` | The documents listed above |

## Quick start

Needs Laragon (PHP 8.2 or newer, MySQL, Composer) and Node.js 20.19 or newer. The full steps, with fixes for common problems, are in [docs/INSTALLATION.md](docs/INSTALLATION.md).

```
mysql -u root -e "CREATE DATABASE sibol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=DemoSeeder

cd ..\frontend
npm install
copy .env.example .env
```

Then run each of these in its own terminal:

```
cd backend
php artisan serve
```

```
cd frontend
npm run dev
```

Open http://localhost:5173.

## Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@sibol.test | password |
| Admin (rooftop demo farm) | ana@sibol.test | password |
| Admin (indoor demo farm) | ben@sibol.test | password |

The Super Admin comes from `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `backend/.env`, read when the database is first seeded. The two Admins come from the demo seeder.

If no Super Admin can log in, get a new temporary password from the terminal:

```
cd backend
php artisan sibol:reset-password superadmin@sibol.test
```

## Tests

```
cd backend
php artisan test
```

```
cd frontend
npm test
```

The backend tests run on an in-memory SQLite database and do not touch the MySQL data.
