# Pruebas de Estrés con Artillery

Este directorio contiene la configuración de Artillery para probar el rendimiento del backend bajo carga extrema de usuarios concurrentes.

## Ejecutar Pruebas de Carga

Para correr las pruebas, asegúrate de haber instalado las dependencias `npm install` en la raíz del backend.

**Ejecutar contra el entorno local (Aconsejable primero):**
```bash
npm run test:load:local
```

**Ejecutar contra PRODUCCIÓN (Render):**
Precaución: Esto inyectará usuarios en la base de datos de verdad y puede afectar la cuota de Neon DB o el uso de CPU de Render.
```bash
npm run test:load
```
