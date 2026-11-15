FROM node:24-bookworm-slim AS frontend
WORKDIR /src
RUN npm install -g pnpm@10
COPY fittrack/package.json fittrack/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY fittrack/ ./
RUN pnpm build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Backend/Backend.csproj Backend/
RUN dotnet restore Backend/Backend.csproj
COPY Backend/ Backend/
RUN dotnet publish Backend/Backend.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out ./
COPY --from=frontend /src/dist ./wwwroot

USER 1000:1000
ENTRYPOINT ["dotnet", "Backend.dll"]
