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

- App local: Tauri + interfaz web
- Base local: SQLite
- Cloud: Node.js/Express + PostgreSQL
- Hosting cloud: Railway
- Repositorio: https://github.com/ceduardox/caja-sgi-mutua.git

## Regla principal

La tienda opera localmente. Railway no debe ser necesario para registrar ventas.

