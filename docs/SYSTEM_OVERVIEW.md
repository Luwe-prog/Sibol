# Sibol: what the system does and who can do what

**Sibol** is the system built for *A Field Engagement on Indoor and Rooftop Farming System with Optimization*. It helps a small indoor or rooftop farm use water well: it tells the grower whether to water each growing area, and how many liters to apply.

There are no sensors. A person measures three things with handheld meters and types them in:

- soil moisture (%)
- temperature (°C)
- humidity (%)

Sibol compares the three values with the ideal ranges of the crop growing there, and answers at once with a status, advice, and a number of liters.

This document explains the system's functions and the two user roles. For step-by-step instructions on each screen, see [USER_MANUAL.md](USER_MANUAL.md). To install it, see [INSTALLATION.md](INSTALLATION.md).

## 1. How the data is organized

```
Farm  ──►  Zone  ──►  Reading
            │
            └── grows one Crop (from the crop library)
```

| Term | Meaning |
|---|---|
| **Farm** | One site, such as a school rooftop garden. |
| **Zone** | One growing area in a farm: a bed, a rack, or a rooftop section. It grows exactly one crop, is marked *rooftop* or *indoor*, and has its own water factor. |
| **Reading** | One set of measurements for one zone at one time. |
| **Crop** | An entry in the crop library, holding the ideal minimum and maximum for soil moisture, temperature and humidity. |
| **Water factor** | Liters of water that raise a zone's soil moisture by one percentage point. It depends on the zone's size and soil. |

The database design is in [ERD.md](ERD.md).

## 2. What happens when a reading is entered

This is the core of the system. Each reading goes through four steps.

### Step 1: The values are checked

| Kind of value | Examples | What Sibol does |
|---|---|---|
| Impossible | Soil moisture or humidity outside 0–100%, temperature outside 0–60 °C, negative water applied, a time in the future | Refuses to save |
| Unusual | Temperature below 15 °C or above 45 °C, humidity below 20%, soil moisture of exactly 0% or 100%, a date more than 30 days ago | Shows the reason and asks the user to confirm. If confirmed, the reading is saved and marked **Unusual**. |
| Normal | Everything else | Saves |

### Step 2: A status is given

Each value is compared with the crop's ideal range.

| Measurement | Below the range | Inside the range | Above the range |
|---|---|---|---|
| Soil moisture | **Too Dry** | **Optimal** | **Too Wet** |
| Temperature | Too Cold | Optimal | Too Hot |
| Humidity | Too Low | Optimal | Too High |

The soil moisture status is the zone's main status. It decides the color of the zone's card on the dashboard.

### Step 3: The liters are calculated

When a zone is Too Dry, Sibol aims for the middle of the crop's ideal soil moisture range:

```
liters to apply = (middle of ideal range − current soil moisture) × water factor
```

Example: Kangkong has an ideal range of 70–90%, so the middle is 80%. A zone with a water factor of 0.8 reads 55%.
(80 − 55) × 0.8 = **20 liters**.

For an Optimal or Too Wet zone, the recommended amount is 0 liters.

### Step 4: Advice is written

| Condition | Advice for a rooftop zone | Advice for an indoor zone |
|---|---|---|
| Soil Too Dry | Water now, with the liters to apply | Same |
| Soil Optimal | No watering needed | Same |
| Soil Too Wet | Hold off watering, check drainage, reduce the next watering | Same |
| Too Hot | Water early morning or late afternoon; add shade netting | Improve airflow; move plants from heat sources or raise the grow lights |
| Too Cold | Shield plants from wind; cover them at night | Move plants away from air conditioning and cold drafts |
| Humidity Too High | Water in the morning, keep leaves dry, space plants apart, watch for fungal disease | Increase ventilation |
| Humidity Too Low | Add mulch; check soil moisture more often | Mist the plants or group them together |

The status, liters and advice are **saved with the reading**, together with the crop ranges used. If the crop's ranges are changed later, old readings keep the result they were given.

After watering, the user records the liters actually applied. This feeds the water report.

## 3. Functions of the system

| Function | What it does |
|---|---|
| **Landing page** | Public page that introduces Sibol, with a link to log in. |
| **Login** | Email and password. There is no sign-up page; accounts are created by a Super Admin. |
| **Dashboard** | One color-coded card per zone (amber Too Dry, green Optimal, blue Too Wet, white no readings), counts of each status, and a **Needs attention** list on top. |
| **Alerts** | On-screen only. A zone needs attention when it is Too Dry, Too Wet, or has had no reading for 2 days. The count shows beside **Dashboard** in the menu on every page. |
| **Farms and zones** | List of farms, the zones in each, and forms to add or edit a zone. |
| **Reading entry and result** | Entry form made for a phone, followed at once by the result screen with status, liters and advice. |
| **History** | Every reading of a zone, or of a whole farm, filterable by date and status. Readings can be viewed, edited and deleted. |
| **Trend charts** | Soil moisture, temperature and humidity over 7, 30 or 90 days, with the ideal range shaded. |
| **Next-watering estimate** | Estimates when a zone will need water again, from how fast its soil has been drying between recent readings. |
| **CSV import** | Adds up to 500 readings to a zone from a spreadsheet file. If any line has a problem, nothing is imported and every problem is listed. |
| **Water report** | Compares recommended liters with applied liters, per zone and per farm, for a date range. Shows over- and under-watering. |
| **Export** | The report as CSV, all readings as CSV, and a print layout that can be saved as PDF. |
| **Accounts** | Create accounts, assign farms, reset passwords, deactivate and reactivate. |
| **Crop library** | The crops and their ideal ranges, with the source of each. |
| **Activity log** | A record of who changed what, and when. |

## 4. Roles

Sibol has two roles. A visitor who is not logged in can only see the landing page and the login page.

| | **Admin** | **Super Admin** |
|---|---|---|
| Who it is | The person who tends the farm and takes the measurements | The person in charge of the whole system |
| Farms they can see | Only the farms they are assigned to | All farms |
| How the account is made | By a Super Admin | By another Super Admin. The first one is created when the system is installed. |

### What each role can do

| Action | Admin | Super Admin |
|---|:---:|:---:|
| Log in, log out, change own password | ✅ | ✅ |
| View the dashboard and alerts | ✅ assigned farms | ✅ all farms |
| View farms and zones | ✅ assigned farms | ✅ all farms |
| Add and edit zones (name, crop, rooftop or indoor, water factor, active or not) | ✅ assigned farms | ✅ all farms |
| Enter readings | ✅ assigned farms | ✅ all farms |
| Edit and delete readings, record water applied | ✅ assigned farms | ✅ all farms |
| Import readings from a CSV file | ✅ assigned farms | ✅ all farms |
| View history, trend charts and the next-watering estimate | ✅ assigned farms | ✅ all farms |
| View the water report and download its CSV files | ✅ assigned farms | ✅ all farms |
| Choose a crop from the crop library for a zone | ✅ | ✅ |
| Create farms, edit them, and make them inactive | ❌ | ✅ |
| Assign Admins to farms | ❌ | ✅ |
| Add crops, edit their ideal ranges, and make them inactive | ❌ | ✅ |
| Create Admin and Super Admin accounts | ❌ | ✅ |
| Edit accounts, reset passwords, deactivate and reactivate accounts | ❌ | ✅ |
| View the activity log | ❌ | ✅ |

### Admin

An Admin does the daily work on the farms they are assigned to.

**Menu:** Dashboard, Farms, Water report.

A typical visit:

1. Open the dashboard and check **Needs attention**.
2. Measure a zone and enter the reading.
3. Read the result, water the zone with the liters shown, and record the liters actually applied.
4. Open the zone's page to see its trend charts, history and next-watering estimate.
5. Open the water report at the end of the week to compare recommended and applied water.

An Admin also sets up the zones of their farms: which crop each one grows, whether it is rooftop or indoor, and its water factor.

An Admin **cannot** see or open a farm they are not assigned to, create farms, change a crop's ideal ranges, manage accounts, or read the activity log.

### Super Admin

A Super Admin can do everything an Admin can, on every farm, and also sets up and oversees the system.

**Menu:** Dashboard, Farms, Water report, and under **Manage**: Accounts, Crop library, Activity log.

Their extra responsibilities:

- **Accounts.** Create an account with a role and, for an Admin, the farms they work on. Sibol shows a temporary password once, to hand to the person. Reset a forgotten password, or deactivate an account to stop it from logging in.
- **Farms.** Create farms and decide which Admins work on each. An Admin can have several farms, and a farm can have several Admins.
- **Crop library.** Set the ideal ranges every reading is judged against, and record where the numbers come from. Only a Super Admin can change them, so that all Admins work from the same reference.
- **Activity log.** Review who created or edited accounts, farms, crops and zones, and who edited, deleted or imported readings.

To make sure someone can always get in, a Super Admin **cannot** deactivate their own account, remove their own Super Admin role, or reset their own password from the Accounts page. They change their own password with **Change password**, like everyone else.

## 5. Rules that protect accounts and data

| Rule | Detail |
|---|---|
| No self-registration | Only a Super Admin creates accounts. |
| Temporary passwords | A new or reset account gets a temporary password, and must set its own before using anything else. |
| Logins expire | A login lasts 7 days. Changing a password signs out the other devices; a reset or deactivation signs out all of them. |
| Limited login attempts | 10 attempts per minute. |
| Permissions are checked on the server | Hiding a menu item is not the protection. Every request is checked against the user's role and assigned farms. |
| Nothing important is erased | Accounts, farms, zones and crops are made inactive, not deleted. A deleted reading is kept in the database but hidden. |
| Inactive farms and zones | They leave the dashboard and accept no new readings. Their history and reports stay viewable. |
| History does not change | A reading keeps the status and the crop ranges it was judged with. |
| Changes are traceable | Every reading stores who entered it, and the activity log cannot be edited from the system. Passwords are never written to the log. |

## 6. Limits of the system

- Readings are typed in by hand; no sensor or Arduino is connected. Each reading stores its source (manual or CSV), so sensor input can be added later.
- The recommendation is rule-based, not machine learning. It can be explained and checked by hand.
- The liters depend on each zone's water factor being set correctly. The user manual explains how to measure it.
- The six starter crops (pechay, lettuce, kangkong, tomato, siling labuyo, basil) come with working ranges marked "Provisional (uncited)" in the crop library. A Super Admin replaces them with values from cited sources.
- The next-watering time is an estimate from past readings. Rain or a hot day will shift it.
- The system runs on a local computer. [DEPLOYMENT.md](DEPLOYMENT.md) describes how to put it online; this has not been done.

## 7. How it is built

| Part | Technology |
|---|---|
| Frontend | React with Vite, Tailwind CSS, Recharts for the charts |
| Backend | Laravel 12 (PHP), an API secured with Laravel Sanctum tokens |
| Database | MySQL |
| Tests | 64 backend tests (PHPUnit) and 23 frontend tests (Vitest) |
