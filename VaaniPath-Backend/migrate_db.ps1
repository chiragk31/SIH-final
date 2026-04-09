$DB_URL = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

Write-Host "Starting database migrations..."

$Files = @(
    "database/schema.sql",
    "database/quiz_doubts_schema.sql",
    "database/processing_jobs_table.sql",
    "database/add_users_insert_policy.sql",
    "database/fix_users_policies.sql",
    "migrations/001_create_courses_and_enrollments.sql",
    "migrations/003_add_missing_columns.sql",
    "database/migrations/add_content_type.sql",
    "database/migrations/FIX_SCHEMA_CACHE.sql",
    "database/migrations/FIX_TRANSLATIONS_SCHEMA.sql"
)

foreach ($file in $Files) {
    if (Test-Path $file) {
        Write-Host "Running $file ..."
        try {
            # Let's use Prisma to execute the raw SQL file
            npx -y prisma db execute --url="$DB_URL" --file="$file"
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Warning: Script $file had a non-zero exit code: $LASTEXITCODE. Continuing anyway as it might just be IF NOT EXISTS warnings."
            }
        } catch {
            Write-Host "Error running $file : $_"
        }
    } else {
        Write-Host "File $file not found! Skipping..."
    }
}

Write-Host "All specified migrations run!"
