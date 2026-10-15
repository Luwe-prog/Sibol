# A Field Engagement on Indoor and Rooftop Farming System with Optimization

**Project scope document**: all decisions below were made section by section. Treat this file as the source of truth when building.

## 0. Summary

A website where Admins manually enter environmental readings (soil moisture, temperature, humidity) for farm zones. The system compares each reading with the ideal ranges of the zone's crop, reports whether the zone is **Too Dry / Optimal / Too Wet**, flags temperature and humidity problems, and recommends an action, including **how many liters of water to apply**. No Arduino or hardware; all data is typed in. Two roles: **Super Admin** and **Admin**.

---

## 1. Purpose and scope

- **What is optimized:** water usage. The system recommends *water now* (with an amount in liters), *no watering needed*, or *hold off and reduce the next watering*, to avoid both overwatering and underwatering.
- **Real user:** a small real site (school rooftop garden, relative's garden, barangay urban garden) if one can be found, with a few manual readings as sample data. Otherwise a simulated farm with realistic seeded data.
- **Definition of done:** working web app with both roles, seeded demo data, ERD, short user manual, defense/demo flow.

## 2. Data input

- **Core readings:** soil moisture (%), temperature (°C), humidity (%).
- **Optional fields:** water applied (liters), notes.
- **Who enters:** Admins only (Super Admin can too, across all farms).
- **When:** on demand, one entry per visit. Timestamped automatically; backdating allowed.
- **Structure:** **Farm → Zone → Readings.** A zone is one bed, rack, or rooftop section, labeled `indoor` or `rooftop`, with exactly one crop.
- **Bulk entry:** not in MVP. Readings have a `source` field (`manual` for now) so sensor or CSV input can be added later.
- **Validation:** reject impossible values; flag suspicious ones instead of silently saving them.
  - **Rejected (not saved):** soil moisture or humidity outside 0-100%, temperature outside 0-60 °C, negative water applied, `recorded_at` in the future.
  - **Suspicious (saved after the Admin confirms):** temperature below 15 °C or above 45 °C, humidity below 20%, soil moisture of exactly 0% or 100%, `recorded_at` more than 30 days in the past.
  - A suspicious reading is stored with `is_suspicious = true` and a `suspicious_reason`, and is marked in the history table. It still gets a status and recommendation.

## 3. Decision rules

- **Rule-based thresholds per crop**, stored in the database (never hardcoded), editable only by the Super Admin. Each crop has min/max for soil moisture, temperature, and humidity.
- **Sources:** threshold ranges must be cited (DA, PhilRice, university extension guides) and listed in the documentation. Use one consistent soil moisture scale.
- **Statuses:**
  - Soil moisture (main zone status): `Too Dry`, `Optimal`, `Too Wet`
  - Temperature flag: `Too Cold`, `Optimal`, `Too Hot`
  - Humidity flag: `Too Low`, `Optimal`, `Too High`
- **Recommendations (rule-based):** `recommendation_text` is the soil moisture message, followed by the temperature and humidity messages when those flags are not `Optimal`. Message wording lives in one place in the backend (the recommendation service), not in the database.

  | Condition | Rooftop message | Indoor message |
  |---|---|---|
  | Soil `Too Dry` | Water now, with suggested liters | Same |
  | Soil `Optimal` | No watering needed | Same |
  | Soil `Too Wet` | Hold off watering, check drainage, and reduce the amount at the next watering | Same |
  | Temp `Too Hot` | Water early in the morning or late in the afternoon; add shade netting | Improve airflow; move plants away from heat sources or raise the grow lights |
  | Temp `Too Cold` | Shield plants from wind; cover them at night | Move plants away from air conditioning and cold drafts |
  | Humidity `Too High` | Water in the morning, keep leaves dry, space plants apart; watch for fungal disease | Increase ventilation |
  | Humidity `Too Low` | Add mulch and check soil moisture more often | Mist the plants or group them together |
- **Optimization formula** (applies when Too Dry):

  ```
  target moisture    = midpoint of the crop's optimal soil moisture range
  recommended liters = max(0, target moisture − current moisture) × zone water factor
  ```

  `zone water factor` = liters per percentage point for that zone, set by the Admin from the zone's size and soil.
- **Water applied:** `water_applied_liters` on a reading means the water applied during that same visit, after the reading was taken, in response to that reading's recommendation. The Admin enters it on the result screen or adds it later by editing the reading.
- **Reports** compare `recommended_liters` with `water_applied_liters` of the same reading. Readings with no water applied recorded are left out of the totals and shown as a "not recorded" count.
- **No machine learning.**
- **Stretch:** "next watering estimate" from the average drying rate of recent readings.

## 4. Crops and environments

- **Seed crops (6):** pechay, lettuce, kangkong, tomato, siling labuyo, basil.
- **Indoor vs. rooftop:** same crop thresholds in both. The environment changes the **recommendation messages** (rooftop: heat/sun advice; indoor: humidity/ventilation advice). Differences in drying speed are handled by the per-zone water factor.
- **Crop management:** Super Admin only. Admins pick a crop from the library when creating a zone; they cannot edit thresholds.
- **Retiring records:** crops, zones, and farms are never deleted; each has an `is_active` flag.
  - Inactive crop: cannot be picked for new zones; existing zones keep it.
  - Inactive zone: hidden from the dashboard and alerts, accepts no new readings; its history and reports stay viewable.
  - Inactive farm: same as an inactive zone, for all of its zones.
- **History integrity:** compute and **store the status with each reading** at save time, so later threshold edits do not rewrite history.

### Threshold table (provisional, to be replaced from cited sources)

The values below are **uncited working estimates** so the seeders and the status engine can be built and tested. They must be replaced with cited values before the defense. Soil moisture is assumed to be a 0-100% reading from a handheld soil moisture meter; confirm the measuring method before citing.

| Crop | Soil moisture min-max (%) | Temp min-max (°C) | Humidity min-max (%) | Source |
|---|---|---|---|---|
| Pechay | 60-80 | 18-30 | 60-80 | Provisional (uncited) |
| Lettuce | 60-80 | 15-25 | 50-70 | Provisional (uncited) |
| Kangkong | 70-90 | 24-35 | 60-85 | Provisional (uncited) |
| Tomato | 60-80 | 20-30 | 50-70 | Provisional (uncited) |
| Siling labuyo | 50-70 | 21-32 | 50-70 | Provisional (uncited) |
| Basil | 50-70 | 20-30 | 40-60 | Provisional (uncited) |

## 5. Roles and permissions

| Action | Super Admin | Admin |
|---|---|---|
| Create, deactivate, reset passwords for Admin accounts | ✅ | ❌ |
| Create farms and assign Admins | ✅ | ❌ |
| Manage crop library and thresholds | ✅ | ❌ |
| Create/edit zones (crop, indoor/rooftop, water factor) | ✅ all farms | ✅ assigned farms |
| Enter/edit readings and water applied | ✅ all farms | ✅ assigned farms |
| View dashboard, history, recommendations | ✅ all farms | ✅ assigned farms |
| View reports | ✅ all farms | ✅ assigned farms |
| See other Admins' farms | ✅ | ❌ |

- Farm ↔ Admin assignment is **many-to-many**.
- **No self-registration.** Super Admin creates Admins with a temporary password; password change forced on first login. The first Super Admin comes from a seeder.
- Accounts are **deactivated, not deleted**. The same applies to crops, zones, and farms (see section 4).
- Every reading stores `entered_by`; readings use **soft deletes**; editing a reading recomputes its status.

## 6. Features

### Must have (MVP)
- Login with role-based access, forced password change on first login
- Super Admin screens: Admin accounts, farms and assignments, crop library with thresholds
- Admin screens: zone management
- Reading entry form with validation, followed by an **instant result screen** (status, recommendation, suggested liters, and a field to record the water actually applied)
- Dashboard: one color-coded card per zone (Too Dry / Optimal / Too Wet), latest reading, last updated time, "needs attention" list on top
- History per zone: table filterable by date range and status
- Trend charts: soil moisture over time with the optimal band shaded; temperature and humidity lines

### Should have
- On-screen alerts only (no email/SMS): badges/banners for Too Dry / Too Wet zones, plus a **stale data warning** when a zone has no reading for 2 days
- Water report: recommended vs. applied liters per zone/farm over a date range
- Export: CSV export and a print-friendly report page (save as PDF from the browser)
- Mobile-friendly layout, especially the entry form

### Stretch (only after everything above works)
- Next-watering estimate
- CSV import of readings
- Activity log of who changed what

### Demo preparation
Seed about a week of readings across several zones so every status appears (dry, optimal, wet, plus one stale zone). Demo flow: log in as Super Admin → create a farm → switch to Admin → enter a reading → show the recommendation → show charts → show the water report.

## 7. Constraints and logistics

- **Stack:** React + Vite + Tailwind CSS v3.4.1 (plain JSX, no TypeScript), Laravel 12 with Sanctum Bearer tokens, MySQL via Laragon, Recharts for charts.
- **Hosting:** local (Laragon) first. Online deployment is a stretch goal; check current free-tier options at that time.
- **Mobile:** responsive web only, no separate app. Build the entry form mobile-first and test on a real phone over the local network.
- **Build order:**
  1. **Foundation:** database design, migrations, auth, roles, seeders
  2. **Core logic:** crop library, thresholds, zones, reading entry form, status and recommendation engine
  3. **Visibility:** dashboard, history, trend charts
  4. **Reporting:** alerts, water report, CSV/print export
  5. **Finish:** demo seed data, bug fixes, ERD, user manual, demo rehearsal

  Finish phases 1 and 2 first. Once reading entry produces a correct status and liters recommendation, the project works; the rest is presentation and reporting.

## Conventions to follow in code

- Tailwind v3.4.1 only (never v4 syntax); no dynamic class interpolation (use full class strings).
- Laravel 12 with Sanctum Bearer tokens: no CSRF, no `withCredentials`.
- The frontend keeps the token in `sessionStorage`, so closing the tab logs the user out and reopening Sibol shows the landing page.
- PHP enums: use `->value` when passing to string functions.
- Route groups: `->prefix('admin')` already adds the prefix; don't repeat `/admin` in route paths.
- Use seeders (not tinker) for seed data.
- When changing code, provide complete replacement files, not partial diffs.

## Draft data model (to be finalized in the ERD step)

| Table | Key columns |
|---|---|
| `users` | name, email, password, role (`super_admin` / `admin`), is_active, must_change_password |
| `farms` | name, location, description, is_active |
| `farm_user` | farm_id, user_id (many-to-many pivot) |
| `crops` | name, soil_moisture_min/max, temp_min/max, humidity_min/max, source_reference, is_active |
| `zones` | farm_id, crop_id, name, environment (`indoor` / `rooftop`), water_factor, is_active |
| `readings` | zone_id, entered_by, recorded_at, soil_moisture, temperature, humidity, water_applied_liters (nullable), notes (nullable), source, is_suspicious, suspicious_reason (nullable), moisture_status, temp_status, humidity_status, recommended_liters, recommendation_text, soft deletes |

## Open items (not yet known)

- Project deadline and milestone dates
- Grading criteria and their weights (functionality, documentation, presentation): not known yet
- A real partner site: to be looked for later. Build with simulated seeded data for now.

**Settled:** this is a solo project.
- Cited threshold values for the six seed crops (provisional values are in section 4 for now)
- How soil moisture is actually measured on site (handheld meter assumed), which fixes the scale the cited thresholds must use

## Next step

Phase 1 (foundation) is built: ERD in `docs/ERD.md`, migrations, auth with roles and forced password change, Super Admin and crop seeders, and the frontend login flow.

Phase 2 (core logic) is built: Super Admin screens for admin accounts, farms and the crop library; zone management; the reading entry form with the suspicious-value confirmation; the instant result screen; and the status and recommendation engine (`backend/app/Services/RecommendationService.php`).

Phase 3 (visibility) is built: the dashboard with one color-coded card per zone, status counts and a "needs attention" list (which already includes the 2-day stale warning); history per zone filterable by date range and status, 20 per page; and trend charts for soil moisture, temperature and humidity with the ideal range shaded. The three measures are separate charts on purpose, because they do not share a scale.

Phase 4 (reporting) is built: the water report (recommended vs. applied liters per zone and farm over a date range), two CSV exports (the report summary and every reading in the range), a print layout for the report page, and an attention count badge on the Dashboard link that shows on every page.

Phase 5 (finish) is built: the demo seeder (`php artisan db:seed --class=DemoSeeder`), the user manual (`docs/USER_MANUAL.md`), the demo script (`docs/DEMO_SCRIPT.md`), and the ERD (`docs/ERD.md`).

All five build phases are done. What remains before the defense:

- Replace the provisional crop thresholds with cited values (section 4) and record each source in the crop library.
- Confirm how soil moisture is measured, so the cited thresholds use the same scale.
- Rehearse the demo script on the machine that will be used, and test the entry form on a real phone over the local network.
- Put it online if wanted: `docs/DEPLOYMENT.md` has the steps, but it has not been deployed.

Built after the five phases:

- Stretch items: the next-watering estimate (`backend/app/Services/WateringEstimator.php`), CSV import of readings per zone, and the activity log.
- More than one Super Admin, with a command-line password recovery (`php artisan sibol:reset-password`).
- Logins expire after 7 days.
- Farm-wide history page.
- Each reading stores the crop ranges it was judged against, so the chart band follows threshold changes.
- Frontend tests (`npm test`) and per-page code loading.
