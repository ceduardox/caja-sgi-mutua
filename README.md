# SGI Market Caja

Sistema de ventas local-first para tienda.

## Nombre

- Nombre completo: SGI Market Mutualista Caja
- Nombre corto: SGI Market Caja
- Abreviacion: SGI Caja

## Decision tecnica

La caja debe funcionar instalada en una PC Windows y vender aunque no haya internet.
La nube se usara para sincronizacion, reportes, licencias, backups y suscripciones.

## Estructura prevista

```text
app-local/       App de caja instalada en Windows
cloud/           API y panel central para Railway
docs/            Documentacion funcional y tecnica
```

## Stack objetivo

- App local: Electron + interfaz web
- Base local: SQLite
- Cloud: Node.js/Express + PostgreSQL
- Hosting cloud: Railway
- Repositorio: https://github.com/ceduardox/caja-sgi-mutua.git

## Instalador Windows

```bash
npm.cmd install
npm.cmd run dist
```

El instalador queda en:

```text
dist\SGI Market Caja Setup 0.1.0.exe
```

En la app instalada, la base local se guarda en AppData para permitir actualizar
instalando encima sin perder productos, ventas ni auditoria.

## Backend Cloud Railway

Railway debe ejecutar el servicio cloud con:

```bash
npm run cloud
```

El archivo `railway.json` ya deja configurado ese comando y el healthcheck en
`/api/health`. El backend cloud usa PostgreSQL por `DATABASE_URL` y crea el
admin maestro desde las variables `MASTER_ADMIN_*`.

La caja local intenta sincronizar eventos pendientes con el cloud cada 5 minutos
por defecto usando `SGI_SYNC_INTERVAL_SECONDS=300`.

## Regla principal

La tienda opera localmente. Railway no debe ser necesario para registrar ventas.
