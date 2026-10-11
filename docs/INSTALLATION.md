# Installing Sibol on a new computer

This guide takes a Windows laptop from nothing to a running copy of Sibol. It takes about 15 minutes, most of it downloads.

Sibol has two parts that run side by side:

| Part | Folder | What it is | Runs at |
|---|---|---|---|
| Backend | `backend/` | Laravel 12 API with a MySQL database | http://localhost:8000 |
| Frontend | `frontend/` | React pages, served by Vite | http://localhost:5173 |

You use Sibol by opening the **frontend** address in a browser.

## 1. What to install first

| Software | Version | Notes |
|---|---|---|
| [Laragon](https://laragon.org/download/) | Any that gives PHP 8.2 or newer | Provides PHP, MySQL and Composer in one install |
| [Node.js](https://nodejs.org/) | 20.19 or newer (or 22.12 or newer) | The LTS installer is fine |
| [Git](https://git-scm.com/downloads) | Any | To clone the repository |

After installing, open the **Laragon terminal** (Laragon window → **Terminal**) and check the versions:

```
php -v
composer -V
node -v
```

`php -v` must show 8.2 or newer. If it shows an older version, add a newer PHP in Laragon (Menu → PHP → Version) before going on.

Run every command in this guide from the Laragon terminal, so that `php`, `composer` and `mysql` are found.

XAMPP or a separate PHP and MySQL install also works, as long as PHP is 8.2 or newer and Composer is installed. The steps are the same; only the way you start MySQL differs.

## 2. Get the code

```
cd C:\laragon\www
git clone https://github.com/Luwe-prog/Sibol.git
cd Sibol
```

The folder can be anywhere. `C:\laragon\www` is only a convenient place.

## 3. Create the database

1. In Laragon, select **Start All** so MySQL is running.
2. Create an empty database named `sibol`:

   ```
   mysql -u root -e "CREATE DATABASE sibol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

   You can also create it in HeidiSQL (Laragon → **Database**) with the same name.

## 4. Set up the backend

```
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=DemoSeeder
```

What these do:

| Command | Result |
|---|---|
| `composer install` | Downloads the PHP libraries into `backend/vendor` |
| `copy .env.example .env` | Creates the local settings file |
| `php artisan key:generate` | Writes the app's encryption key into `.env` |
| `php artisan migrate --seed` | Creates the tables, the first Super Admin, and the six starter crops |
| `php artisan db:seed --class=DemoSeeder` | Adds two demo farms, seven zones, a week of readings, and two Admin accounts |

The demo seeder is optional, but without it the system starts empty.

The settings in `.env` match a default Laragon install: MySQL on `127.0.0.1:3306`, user `root`, no password. If your MySQL uses a password, open `backend/.env`, set `DB_PASSWORD`, and run the two `php artisan` seeding commands again.

## 5. Set up the frontend

```
cd ..\frontend
npm install
copy .env.example .env
```

`frontend/.env` holds one setting, the address of the backend: `VITE_API_URL=http://localhost:8000/api`.

## 6. Run it

Make sure MySQL is started in Laragon, then open **two** terminals and leave both running.

Terminal 1, the backend:

```
cd C:\laragon\www\Sibol\backend
php artisan serve
```

Terminal 2, the frontend:

```
cd C:\laragon\www\Sibol\frontend
npm run dev
```

Open **http://localhost:5173**. You see the landing page; select **Log in**.

## 7. Log in

| Role | Email | Password | Sees |
|---|---|---|---|
| Super Admin | `superadmin@sibol.test` | `password` | Everything |
| Admin | `ana@sibol.test` | `password` | Demo Rooftop Garden only |
| Admin | `ben@sibol.test` | `password` | Demo Indoor Grow Room only |

The two Admin accounts exist only if you ran the demo seeder.

## 8. Check that it works

1. Log in as `ana@sibol.test`. The dashboard shows four zones: Bed A is Too Dry, Bed C is Too Wet, and Bed D has had no reading for 2+ days.
2. On Bed B, select **Enter reading**, type soil moisture `55`, temperature `31`, humidity `70`, and save. The result is **Too Dry** with **20 liters** to apply.
3. Log out and log in as the Super Admin. The menu now also shows **Accounts**, **Crop library** and **Activity log**.

If all three work, the installation is complete. [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) explains what each role can do.

## Starting it again later

Nothing needs to be installed again. Each time:

1. Start MySQL in Laragon (**Start All**).
2. Run `php artisan serve` in `backend`.
3. Run `npm run dev` in `frontend`.
4. Open http://localhost:5173.

To stop, press `Ctrl + C` in each terminal.

The demo readings are dated back from the day the demo seeder ran, so after a few days every demo zone shows as out of date. Run `php artisan db:seed --class=DemoSeeder` in `backend` again to refresh them. It rebuilds only the two demo farms and leaves other data alone.

## Running the tests (optional)

```
cd backend
php artisan test
```

```
cd frontend
npm test
```

The backend tests use a temporary in-memory SQLite database, so they never touch the data in MySQL.

## If something goes wrong

| What you see | Cause and fix |
|---|---|
| `'php' is not recognized` or `'composer' is not recognized` | The command was run outside the Laragon terminal. Open the terminal from the Laragon window. |
| `composer install` says your PHP version does not satisfy the requirement | PHP is older than 8.2. Switch to a newer version in Laragon (Menu → PHP → Version). |
| `SQLSTATE[HY000] [2002]` or "connection refused" during `migrate` | MySQL is not running. Select **Start All** in Laragon. |
| `Unknown database 'sibol'` | Step 3 was skipped. Create the database, then run `php artisan migrate --seed` again. |
| `Access denied for user 'root'` | Your MySQL has a password. Set `DB_PASSWORD` in `backend/.env`. |
| `No application encryption key has been specified` | Run `php artisan key:generate` in `backend`. |
| `npm run dev` fails with a Node.js version message | Node.js is older than 20.19. Install the current LTS. |
| The login page says "Cannot reach the server" | `php artisan serve` is not running, or it started on a different port (see the next row). |
| `php artisan serve` starts on port 8001 instead of 8000 | Something else is using port 8000. Either close it, or change `VITE_API_URL` in `frontend/.env` to `http://localhost:8001/api` and restart `npm run dev`. |
| A blank page at http://localhost:5173 | `npm run dev` is not running. |
| Opening http://localhost:8000 shows only a short "Sibol API" message | That is correct. The backend has no pages; use http://localhost:5173. |
| The Super Admin password is not `password` | It was changed inside the app. Run `php artisan sibol:reset-password superadmin@sibol.test` in `backend` to get a new temporary one. |

## Starting over with a clean database

```
cd backend
php artisan migrate:fresh --seed
php artisan db:seed --class=DemoSeeder
```

This **deletes all data**, then re-creates the Super Admin, the six crops and the demo farms.
