# Stage 1: Build the React PWA frontend with pnpm
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY Frontend/package.json Frontend/pnpm-lock.yaml* Frontend/pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY Frontend/ ./
RUN pnpm run build

# Stage 2: Compile the C# Native AOT binary
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/Backend.csproj ./
RUN dotnet restore Backend.csproj

COPY Backend/ ./
RUN dotnet publish Backend.csproj \
    -c Release \
    --no-restore \
    -o /app/publish

# Stage 3: Minimal chiseled runtime
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0-noble-chiseled
WORKDIR /app

COPY --from=backend-build /app/publish/Backend ./Backend
COPY --from=frontend-build /app/frontend/dist ./wwwroot

VOLUME ["/data"]
ENV DB_PATH=/data/fittrack.db
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["./Backend"]
