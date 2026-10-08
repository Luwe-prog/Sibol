# Putting Sibol online

Sibol runs locally on Laragon by default. This guide covers what is needed to host it so it can be opened from anywhere. It has **not been deployed yet**: the steps below are the standard ones for a Laravel API with a React frontend, and the settings they rely on are already in the code.

## What has to be hosted

| Part | What it is | Needs |
|---|---|---|
| Backend | Laravel 12 API in `backend/` | PHP 8.2 or newer, Composer, a public HTTPS address |
| Database | MySQL 8 | Reachable from the backend |
| Frontend | Static files built from `frontend/` | Any static file host |

## Choosing a host

Free tiers change often, so check each provider's current terms before committing. As of October 2026:

- **Free web services exist** (Render and Koyeb both list one), but their free databases are **PostgreSQL, not MySQL**. Sibol is built and tested on MySQL. Its queries are standard and its test suite runs on SQLite, so PostgreSQL will probably work, but it has not been tried.
- **Railway supports MySQL directly**, but has a one-time trial credit instead of a permanent free tier. Its paid plan starts at about $5 a month.
- Free web services usually **sleep when idle**. The first request after a pause can take up to a minute. Open the site a few minutes before a demo.

The frontend is only static files, so it can go on any free static host, or be served by the same web server as the backend.

For a defense, a hosted copy is a bonus. Keep the local Laragon setup ready as the fallback.

## Backend

1. Copy the `backend/` folder to the host, or connect the host to the repository.
2. Install and prepare:

   ```
   composer install --no-dev --optimize-autoloader
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --force
   php artisan config:cache
   php artisan route:cache
   ```

3. Point the web server's document root at `backend/public`.
4. Set these environment variables:

   | Variable | Value |
   |---|---|
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `APP_URL` | The backend's public address, with `https://` |
   | `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | From the database provider |
   | `CORS_ALLOWED_ORIGINS` | The frontend's public address, for example `https://sibol.example.com`. Separate several with commas. |
   | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | The first Super Admin. Use a strong password; do not leave it as `password`. |
   | `SANCTUM_EXPIRATION_MINUTES` | Optional. How long a login lasts. The default is 10080 (7 days). |

`APP_DEBUG=false` matters: with it on, an error page can show database details to anyone.

## Frontend

1. Set the API address **before building**, in `frontend/.env`:

   ```
   VITE_API_URL=https://your-backend-address/api
   ```

2. Build:

   ```
   cd frontend
   npm install
   npm run build
   ```

3. Upload the contents of `frontend/dist` to the static host.
4. Configure the host to serve `index.html` for any path that is not a file. Without this, refreshing a page such as `/farms/3` gives "not found". Most static hosts call this a "single-page app" or "rewrite all to index.html" setting.

The API address is fixed into the files at build time. If the backend address changes, build and upload again.

## After deploying

1. Open the frontend address and log in as the Super Admin.
2. Change the Super Admin password if it was seeded with a simple one.
3. Create a farm, a zone and a reading, to confirm the frontend can reach the backend.
4. Download a CSV from the water report, to confirm file downloads work across the two addresses.

Do not run `DemoSeeder` on a copy that holds real data unless you want the demo farms there. It only touches the two "Demo ..." farms and the two demo Admins, but those Admins have the password `password`.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| "Cannot reach the server" on the login page | `VITE_API_URL` is wrong, or was changed without rebuilding |
| Browser console shows a CORS error | `CORS_ALLOWED_ORIGINS` does not exactly match the frontend address, including `https://` and no trailing slash. Run `php artisan config:cache` after changing it. |
| Refreshing a page gives "not found" | The static host is not rewriting unknown paths to `index.html` |
| Everything returns a server error | Check `APP_KEY` is set and the database variables are right; read `storage/logs/laravel.log` |
| Locked out of the only Super Admin | On the server: `php artisan sibol:reset-password their@email` |

## Sources

- [Platforms with a real free tier for developers in 2026 (Render)](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026.md)
- [Hosting and PaaS free tier comparison 2026](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [Render vs Railway 2026](https://www.kunalganglani.com/blog/render-vs-railway-2026)
- [Railway vs Render comparison](https://www.13labs.au/compare/railway-vs-render)
