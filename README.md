# FitTrack

Self-hosted weight and food tracking. A .NET backend serves the React frontend
and stores data in SQLite.

## Run

```bash
mkdir -p data uploads seed
curl -fL --progress-bar -o seed/OFF.csv.gz https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
docker compose up -d
```

Open http://localhost:8080. The first start imports the food database;
`docker compose logs -f fittrack` shows progress.

## Data

- `data/fittrack.db` — database
- `uploads/` — progress photos
- `seed/OFF.csv.gz` — food export, only read when the database has no food

Stop the container and copy `data/` and `uploads/` to back it up.

## Development

```bash
dotnet run --project Backend               # http://localhost:5159
cd fittrack && pnpm install && pnpm dev    # http://localhost:5173
```

## Configuration

| Variable | Default |
|---|---|
| `ConnectionStrings__FitTrack` | `Data Source=/data/fittrack.db` |
| `FoodData__CsvPath` | `/seed/OFF.csv.gz` |
| `Storage__UploadsPath` | `/uploads` |
