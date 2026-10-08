# Sibol ERD

This matches the migrations in `backend/database/migrations`. Laravel's own tables (`cache`, `jobs`, `sessions`, `personal_access_tokens`, `password_reset_tokens`) are left out.

```mermaid
erDiagram
    users ||--o{ farm_user : "is assigned"
    farms ||--o{ farm_user : "has admins"
    farms ||--o{ zones : "has"
    crops ||--o{ zones : "is grown in"
    zones ||--o{ readings : "has"
    users ||--o{ readings : "entered"
    users ||--o{ activity_logs : "did"

    users {
        bigint id PK
        string name
        string email UK
        string password
        string role "super_admin or admin"
        boolean is_active
        boolean must_change_password
        timestamps created_at_updated_at
    }

    farms {
        bigint id PK
        string name
        string location "nullable"
        text description "nullable"
        boolean is_active
        timestamps created_at_updated_at
    }

    farm_user {
        bigint id PK
        bigint farm_id FK
        bigint user_id FK
        timestamps created_at_updated_at
    }

    crops {
        bigint id PK
        string name UK
        decimal soil_moisture_min "percent"
        decimal soil_moisture_max "percent"
        decimal temp_min "Celsius"
        decimal temp_max "Celsius"
        decimal humidity_min "percent"
        decimal humidity_max "percent"
        string source_reference "nullable"
        boolean is_active
        timestamps created_at_updated_at
    }

    zones {
        bigint id PK
        bigint farm_id FK
        bigint crop_id FK
        string name "unique per farm"
        string environment "indoor or rooftop"
        decimal water_factor "liters per moisture point"
        boolean is_active
        timestamps created_at_updated_at
    }

    readings {
        bigint id PK
        bigint zone_id FK
        bigint entered_by FK "users.id"
        datetime recorded_at
        decimal soil_moisture "percent"
        decimal temperature "Celsius"
        decimal humidity "percent"
        decimal water_applied_liters "nullable"
        text notes "nullable"
        string source "manual"
        boolean is_suspicious
        string suspicious_reason "nullable"
        string moisture_status "too_dry, optimal, too_wet"
        string temp_status "too_cold, optimal, too_hot"
        string humidity_status "too_low, optimal, too_high"
        json thresholds "crop ranges used, nullable"
        decimal recommended_liters
        text recommendation_text
        timestamps created_at_updated_at
        timestamp deleted_at "soft delete"
    }

    activity_logs {
        bigint id PK
        bigint user_id FK "nullable"
        string action "for example crop.updated"
        string subject_type "nullable"
        bigint subject_id "nullable"
        string description
        json changes "before and after, nullable"
        timestamp created_at
    }
```

## Relationships

- **users ↔ farms:** many-to-many through `farm_user`. An Admin sees only the farms they are assigned to; a Super Admin sees all farms and needs no assignment.
- **farms → zones:** one farm has many zones.
- **crops → zones:** each zone grows exactly one crop. A crop that is in use cannot be deleted.
- **zones → readings:** one zone has many readings.
- **users → readings:** every reading records who entered it in `entered_by`.
- **users → activity_logs:** each log entry records who made a change. `user_id` is empty for changes made from the command line. `subject_type` and `subject_id` name the record that was changed, without a database-level link, so entries survive whatever happens to that record.

## Rules the schema enforces

- `users.email` and `crops.name` are unique. A zone name is unique within its farm.
- An Admin can be assigned to a farm only once (`farm_user` is unique on `farm_id` + `user_id`).
- Users, farms, crops and zones are retired with `is_active = false`, never deleted. Readings are soft-deleted.
- A reading stores its statuses and recommendation at save time, so editing a crop's thresholds later does not change history. It also stores the ranges it was judged against in `thresholds`, which the trend charts use to draw the band.
- `readings.source` is `manual` for typed-in readings and `csv` for imported ones.
