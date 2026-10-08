# Sibol User Manual

Sibol helps you decide when and how much to water the crops in an indoor or rooftop farm. You type in three measurements for a growing area. Sibol compares them with the ideal ranges for that crop and tells you whether the soil is **Too Dry**, **Optimal** or **Too Wet**, what to do about it, and how many liters of water to apply.

Sibol has no sensors. Every measurement is typed in by a person.

## Who uses Sibol

| Role | What they do |
|---|---|
| **Admin** | Takes measurements and enters them. Manages the growing areas (zones) on the farms they are assigned to. |
| **Super Admin** | Does everything an Admin can, on every farm. Also creates accounts, creates farms, manages the crop library, and can read the activity log. |

## Words used in this manual

- **Farm**: one site, such as a school rooftop garden.
- **Zone**: one growing area inside a farm, such as one bed or one rack. A zone grows exactly one crop and is either *rooftop* or *indoor*.
- **Reading**: one set of measurements for one zone, taken at one time.
- **Water factor**: how many liters of water raise a zone's soil moisture by one percentage point. Each zone has its own.

---

## Part 1: For everyone

### Logging in

1. Open Sibol in your browser.
2. Type your email and password, then select **Log in**.

You cannot create your own account. A Super Admin creates it and gives you a temporary password.

### Your first login

The first time you log in, Sibol asks you to set a new password before you can do anything else.

1. Type the temporary password you were given.
2. Type a new password of at least 8 characters, twice.
3. Select **Save new password**.

### Changing your password later

Select your name at the top right of any page, then fill in the same form.

### Forgot your password

Ask a Super Admin to reset it. You will get a new temporary password and will be asked to change it at your next login.

### Logging out

Select **Log out** at the top right. Always log out on a shared phone or computer.

---

## Part 2: For Admins

### The dashboard

The dashboard is the first page after login. It shows every active zone on your farms.

- **The four counts at the top** show how many zones are Too Dry, Optimal, Too Wet, or have no readings yet.
- **Needs attention** lists the zones to deal with first. Too Dry zones come first, with the liters to apply.
- **The zone cards** are grouped by farm. Each card shows the latest reading and how long ago it was taken.

Card colors:

| Color | Meaning |
|---|---|
| Amber | Too Dry: water now |
| Green | Optimal: no watering needed |
| Blue | Too Wet: hold off watering |
| White | No readings yet |

A badge that says **No reading for 2+ days** means the zone's status may be out of date. Take a new reading.

The number beside **Dashboard** in the menu is the count of zones that need attention. You can see it from any page.

### Taking measurements

Before you enter a reading, measure these three things in the zone:

| Measurement | Unit | Allowed values |
|---|---|---|
| Soil moisture | percent (%) | 0 to 100 |
| Temperature | degrees Celsius (°C) | 0 to 60 |
| Humidity | percent (%) | 0 to 100 |

Use the same soil moisture meter each time, and push it to about the same depth, so readings can be compared.

### Entering a reading

1. On the dashboard, find the zone and select **Enter reading**.
2. Type the soil moisture, temperature and humidity. The ideal range for the crop is shown under each box.
3. Leave **Recorded at** as it is, unless you took the measurement earlier. If so, set the time you took it.
4. Add a note if something is worth remembering, such as "rained last night".
5. Select **Save and see result**.

The form works on a phone, so you can enter the reading while standing at the zone.

### If Sibol says the reading looks unusual

Some values are possible but unlikely, for example a temperature above 45 °C or a soil moisture of exactly 0%. Sibol does not save these straight away. It shows the reason and asks you to check.

- If you made a typing mistake, correct the value and save again.
- If the value is correct, select **Save anyway**. The reading is saved and marked **Unusual** in the history.

Values that are impossible, such as a soil moisture of 120% or a time in the future, cannot be saved at all.

### Reading the result

After saving, Sibol shows the result:

- **The status**: Too Dry, Optimal or Too Wet.
- **Liters to apply**, when the zone is Too Dry.
- **Advice**, which also covers temperature and humidity when they are outside the ideal range. The advice differs for rooftop and indoor zones.

| Status | What to do |
|---|---|
| Too Dry | Water now with the number of liters shown. |
| Optimal | Do not water. |
| Too Wet | Do not water. Check that the zone drains properly, and use less water next time. |

### Recording the water you applied

After you water the zone, type the liters you actually used into **Water actually applied** on the result page and select **Save water applied**.

If you did not water, type `0`. If you leave the box empty, Sibol treats it as "not recorded", and that reading is left out of the water report.

You can come back and fill this in later: open the zone, find the reading in the history, and select **View**.

### Correcting or deleting a reading

1. Open the zone and find the reading under **History**.
2. Select **View**.
3. Select **Edit** to correct it, or **Delete** to remove it.

When you change a measurement, Sibol works out the status and advice again.

### Looking at a zone's history and trends

Select a zone's name to open its page.

- **Next watering** estimates when the zone will need water again (see below).
- **Trends** shows three charts: soil moisture, temperature and humidity over the last 7, 30 or 90 days. The green band is the ideal range each reading was judged against, so it steps up or down if the crop's ranges were changed. Point at a dot to see the exact value.
- **History** lists every reading. Use **From**, **To** and **Status** to narrow the list, for example to see only the Too Dry readings from last week.

To see the readings of every zone in a farm in one list, open the farm and select **Farm history**. It has the same filters, plus one for the zone.

### The next-watering estimate

Sibol looks at how fast a zone's soil moisture has been falling between recent readings, and estimates when it will drop below the crop's ideal range. It shows on the zone's page, on its dashboard card, and on the result page.

- **"Next watering in 3 days"** means the zone should be fine until then.
- **"Likely needs water now"** means the estimated time has passed. Take a reading to confirm.
- **No estimate** means there are too few recent readings. Sibol needs at least two stretches of drying in the last 14 days, from readings taken no more than 4 days apart. Taking a reading every day or two is enough.

This is an estimate from past readings, not a measurement. Rain, a hot day or a change in how you water will shift it. Always trust a new reading over the estimate.

### Importing readings from a file

If you have readings written down or kept in a spreadsheet, you can add many at once instead of typing each one.

1. Open the zone and select **Import CSV**.
2. Select **Download a template** to get a file with the right columns, and fill it in with a spreadsheet program. Save it as CSV.
3. Choose your file and select **Import**.

The file needs these columns in its first line:

| Column | Required | Example |
|---|---|---|
| `recorded_at` | Yes | `2026-10-06 07:30` |
| `soil_moisture` | Yes | `58` |
| `temperature` | Yes | `29` |
| `humidity` | Yes | `68` |
| `water_applied_liters` | No | `6` |
| `notes` | No | `Watered after reading` |

Things to know:

- A file can hold up to 500 readings, all for the one zone you opened.
- If any line has a problem, **nothing is imported**. Sibol lists each line and what is wrong with it. Fix the file and import again.
- A reading with the same time as one the zone already has is treated as a problem, so importing the same file twice does no harm.
- Unusual values are imported and marked **Unusual**, the same as when you confirm one by hand.
- Imported readings are marked **Imported** in the history.

### Managing zones

Select **Farms** in the menu, then open a farm.

**To add a zone:**

1. Select **New zone**.
2. Type a name, such as "Bed A".
3. Choose the crop.
4. Choose **Rooftop** or **Indoor**.
5. Type the water factor (see below).
6. Select **Save zone**.

**To change a zone**, select **Edit** on its card.

**To retire a zone** you no longer use, select **Edit** and untick **Zone is active**. It disappears from the dashboard and takes no new readings, but its history is kept.

### Working out the water factor

The water factor is the number of liters that raise the zone's soil moisture by one percentage point. Sibol uses it to turn "too dry by 15 points" into liters.

To find it for a zone:

1. Measure the soil moisture. Example: 50%.
2. Apply a known amount of water evenly. Example: 5 liters.
3. Wait about 30 minutes, then measure again. Example: 60%.
4. Divide the liters by the rise in moisture: 5 ÷ (60 − 50) = **0.5**.

A larger bed, or soil that drains quickly, has a higher water factor. If Sibol's recommendations turn out to be too much or too little, measure again and update the zone.

### How the liters are calculated

Sibol aims for the middle of the crop's ideal range.

> liters to apply = (middle of ideal range − current soil moisture) × water factor

Example: Pechay has an ideal range of 60% to 80%, so the middle is 70%. A zone with a water factor of 0.5 reads 45%.
(70 − 45) × 0.5 = **12.5 liters**.

### The water report

Select **Water report** in the menu. The report compares the water Sibol recommended with the water you actually applied.

1. Choose the **From** and **To** dates. The report starts with the last 30 days.
2. Choose one farm, or leave it on **All farms**.

For each zone the report shows:

| Column | Meaning |
|---|---|
| Readings | How many readings were taken in the date range |
| Not recorded | How many of them have no water applied filled in |
| Recommended | Liters Sibol recommended |
| Applied | Liters you recorded |
| Difference | "Over" means you applied more than recommended. "Under" means less. |

Recommended and applied liters are counted only for readings where the water applied was filled in. This is why recording it matters, even when the amount is zero.

**To keep a copy:**

- **Print / Save as PDF** opens your browser's print window. Choose "Save as PDF" as the printer to make a file.
- **Report CSV** downloads the table as a spreadsheet file.
- **All readings CSV** downloads every reading in the date range, one row each.

---

## Part 3: For Super Admins

### Accounts

Select **Accounts** in the menu. The list shows every account, both Admins and Super Admins.

**To create an account:**

1. Select **New account**.
2. Type their name and email.
3. Choose the role: **Admin** or **Super Admin**.
4. For an Admin, tick the farms they should work on. A Super Admin sees every farm, so there is nothing to tick.
5. Select **Create account**.
6. Sibol shows a temporary password **once**. Copy it and give it to the person, along with their email.

Create a second Super Admin if you can. If one of you forgets a password, the other can reset it.

**To change a name, email, role or farms**, select **Edit**.

**To reset a forgotten password**, select **Reset password**. The person is logged out everywhere and you get a new temporary password to give them.

**To stop someone from logging in**, select **Deactivate**. Their past readings are kept. Select **Reactivate** to let them back in. Accounts are never deleted.

You cannot deactivate your own account, reset your own password from this page, or remove your own Super Admin role. This makes sure there is always a Super Admin who can log in. To change your own password, select your name at the top right.

**If every Super Admin is locked out**, whoever looks after the server can run this in the `backend` folder, using the Super Admin's email:

```
php artisan sibol:reset-password superadmin@sibol.test
```

It prints a new temporary password and reactivates the account.

### The activity log

Select **Activity log** in the menu to see who changed what, newest first. It records:

- accounts created, edited, deactivated, reactivated, and passwords reset,
- farms created and edited, including changes to assigned Admins,
- crops added and edited, with the old and new ranges,
- zones added and edited,
- readings edited, deleted, and imported from a file.

Use **Show** to narrow the list to one kind of change. Passwords are never written to the log. The log cannot be edited or cleared from the system.

### Farms

Select **Farms** in the menu.

**To create a farm:**

1. Select **New farm**.
2. Type its name, and a location and description if you like.
3. Tick the Admins who should work on it.
4. Select **Save farm**.

An Admin can be assigned to several farms, and a farm can have several Admins. An Admin who is not assigned to a farm cannot see it at all.

**To retire a farm**, select **Edit** and untick **Farm is active**. It disappears from the dashboard and takes no new zones or readings, but its history and reports are kept.

### The crop library

Select **Crop library** in the menu. Each crop has an ideal range for soil moisture, temperature and humidity. Every reading is judged against the ranges of its zone's crop.

**To change a crop's ranges:**

1. Select **Edit** beside the crop.
2. Type the new minimum and maximum values.
3. In **Source of these ranges**, write where the numbers come from.
4. Select **Save crop**.

A change affects new readings only. Readings already saved keep the status they were given.

**To add a crop**, select **New crop** and fill in the same form.

**To retire a crop**, select **Edit** and untick **Crop is active**. Admins can no longer choose it for new zones. Zones already growing it are not affected.

Only Super Admins can change the crop library. Admins choose crops from it but cannot edit the ranges.

---

## Common questions

**I cannot see a farm I should be working on.**
Ask a Super Admin to assign you to it.

**There is no "Enter reading" button on a zone.**
The zone or its farm has been made inactive. Ask a Super Admin if this is a mistake.

**The water report shows 0 liters, but I entered readings.**
The readings have no water applied recorded. Open each reading and fill it in.

**The liters Sibol recommends seem wrong for my zone.**
Check the zone's water factor. See "Working out the water factor" above.

**I was sent back to the login page.**
A login lasts 7 days, after which you log in again. It also ends if your account was deactivated or your password was reset. Log in again, or ask a Super Admin.

**Sibol says it cannot reach the server.**
The system is not running, or your device is not on the same network. Tell whoever looks after the system.
