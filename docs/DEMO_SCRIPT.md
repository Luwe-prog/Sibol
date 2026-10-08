# Sibol demo script

A walk-through for the defense, about 10 minutes. It follows the demo flow in `PROJECT_SCOPE.md` section 6.

## Before the demo

Do these on the day, in this order.

1. Start MySQL from Laragon ("Start All").
2. Rebuild the demo data, so "updated 2 hours ago" and the stale warning are counted from today:

   ```
   cd backend
   php artisan db:seed --class=DemoSeeder
   ```

   This only rebuilds the two "Demo ..." farms and the two demo Admins. Other farms are untouched.
3. Start the two servers, each in its own terminal:

   ```
   cd backend
   php artisan serve
   ```

   ```
   cd frontend
   npm run dev
   ```

4. Open http://localhost:5173 and log in once as each account below, to confirm the passwords.
5. Log out, and leave the browser on the login page.

### Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@sibol.test | (yours) |
| Admin, rooftop farm | ana@sibol.test | password |
| Admin, indoor farm | ben@sibol.test | password |

### What the demo data contains

| Farm | Zone | Crop | What it shows |
|---|---|---|---|
| Demo Rooftop Garden | Bed A | Pechay | **Too Dry** today, and too hot |
| | Bed B | Kangkong | Optimal. One reading 4 days ago is marked Unusual (46 °C) |
| | Bed C | Tomato | **Too Wet**: watered 5 L every day regardless of advice |
| | Bed D | Siling labuyo | **Stale**: last reading 3 days ago |
| Demo Indoor Grow Room | Rack 1 | Lettuce | Optimal |
| | Rack 2 | Basil | Optimal, humidity too high |
| | Rack 3 | Lettuce | No readings yet |

## The demo

### 1. The problem (30 seconds, no screen)

- Small rooftop and indoor farms are watered by habit, so crops get too much or too little.
- Sibol turns three simple measurements into a clear instruction: water or not, and how many liters.
- There is no hardware. Readings are typed in, so any garden with a cheap meter can use it.

### 2. Super Admin: set up (2 minutes)

Log in as the **Super Admin**.

1. **Crop library.** Show the six crops and their ideal ranges. Say: the ranges are stored in the database, not in code, and only the Super Admin can change them.
2. **Farms → New farm.** Create "Barangay Garden". Leave the Admins unticked for now.
3. **Accounts → New account.** Create an Admin (any name and email, role "Admin") and tick "Barangay Garden". Show the temporary password window. Say: there is no self-registration, and the password is shown only once.
4. Copy the temporary password. Log out.

### 3. New Admin: first login (1 minute)

1. Log in with the new Admin's email and the temporary password.
2. Sibol forces a password change. Set one.
3. The dashboard is empty, and **Farms** shows only "Barangay Garden". Say: an Admin sees only the farms they are assigned to.
4. Log out.

### 4. Admin: daily use (4 minutes)

Log in as **ana@sibol.test**.

1. **Dashboard.** Point out, in this order:
   - the counts at the top,
   - "Needs attention": Bed A is Too Dry with the liters to apply, Bed C is Too Wet, Bed D has had no reading for 2+ days,
   - the color-coded cards,
   - the badge beside "Dashboard" in the menu.
2. **Enter a reading.** On Bed B (Kangkong, ideal soil moisture 70–90%), select **Enter reading** and type:
   - Soil moisture **55**, Temperature **31**, Humidity **70**.
   - Select **Save and see result**.
3. **The result.** It shows Too Dry and **20 liters**. Explain the formula: the target is the middle of the ideal range, 80%. (80 − 55) × the zone's water factor of 0.8 = 20 L.
4. **Water applied.** Type **18** and save. Say: this feeds the water report.
5. **Unusual reading.** Select **Enter another reading** and type Soil moisture **75**, Temperature **48**, Humidity **70**. Sibol stops and asks for confirmation. Say: impossible values are rejected, unlikely ones must be confirmed. Do not save it; go back.
6. **Zone page.** Open Bed A from the dashboard.
   - **Trends:** soil moisture falls day by day, jumps after watering, then falls again. The green band is the ideal range.
   - **History:** filter by status "Too Dry" to show the days it needed water.
7. **Next-watering estimate.** Go back to the dashboard and point at an Optimal card, such as Bed B before you entered the dry reading, or Rack 1 when logged in as Ben. It shows "Next watering in ..." worked out from how fast the zone has been drying. Say: the system does not only react to a dry reading, it also says when to come back.

### 5. Reporting (1.5 minutes)

1. Select **Water report**.
2. Point out Bed C: about 35 L applied against 0 L recommended, shown as "over". Say: this is the overwatering the system is meant to catch.
3. Point out the "Not recorded" column and explain that those readings are left out of the totals instead of being counted as zero.
4. Select **Print / Save as PDF** to show the print layout, then cancel.
5. Select **Report CSV** and open the file, if there is time.

### 6. Indoor vs. rooftop (1 minute)

Log out and log in as **ben@sibol.test**.

1. The dashboard shows only the indoor farm. Ana's rooftop farm is not visible.
2. Open Rack 2 (Basil) and select **Advice** on its card. The advice is "increase ventilation", which is the indoor wording. Compare with Bed A's rooftop advice about shade and watering time.

### 7. Close (30 seconds)

- The system optimizes water use: it says when not to water as well as when to water, and by how much.
- Limits to state openly: readings are manual, the recommendation is rule-based and not machine learning, and it depends on a correct water factor for each zone.
- If asked about accountability, open **Activity log** as the Super Admin: it shows who changed which threshold, account or reading, and when.
- Possible next steps: sensor input (each reading already stores its source, and CSV import already works), and hosting it online.

## Likely questions

| Question | Short answer |
|---|---|
| Where do the ideal ranges come from? | Each crop has a "source" field in the crop library. State the sources you cited there. |
| What if a threshold is changed later? | Past readings keep the status they were given. The status is stored with each reading. |
| How is the water factor found? | Apply a known amount of water, measure the rise in soil moisture, and divide. It is in the user manual. |
| Why no sensors? | Scope and cost. Manual entry keeps it usable by any small garden, and the data model is ready for sensors later. |
| Why not machine learning? | There is too little data for it, and a rule can be explained and checked by the user. |
| Can an Admin see another Admin's farm? | No. The server checks the assignment on every request, not only the menu. |
| How is the next watering estimated? | From the average drop in soil moisture per day between recent readings, ignoring the jumps from watering. It needs at least two drying stretches in the last 14 days. |
| What if the Super Admin forgets the password? | Another Super Admin resets it, or it is reset from the server with one command. |
| What happens to deleted data? | Readings are soft-deleted. Accounts, farms, zones and crops are deactivated, never deleted. |
| Does it work on a phone? | Yes. The entry form was built for a phone first. |

## If something goes wrong

| Problem | Fix |
|---|---|
| "Cannot reach the server" | `php artisan serve` is not running, or MySQL is stopped in Laragon. |
| Blank page | `npm run dev` is not running. |
| Demo zones look old or all stale | Run `php artisan db:seed --class=DemoSeeder` again. |
| A demo password does not work | Run the demo seeder again; it restores `password` for Ana and Ben. |
| The whole database is in a bad state | `php artisan migrate:fresh --seed`, then the demo seeder. This deletes everything, including your own farms. |
