# FitTrack

Self-hosted weight and food tracking. A .NET backend serves the React frontend
and stores data in SQLite.

## Run

```bash
mkdir -p data uploads
docker compose up -d
```

Open http://localhost:8080. The first start downloads and imports the Open Food
Facts food database.
`docker compose logs -f fittrack` shows progress.

## Data

- `data/fittrack.db` — database
- `uploads/` — progress photos

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
| `FoodData__SourceUrl` | `https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz` |
| `Storage__UploadsPath` | `/uploads` |
