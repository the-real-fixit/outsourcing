# Pruebas de Estrés con Artillery 🚀

Este directorio contiene la configuración oficial de pruebas de carga (*Load Testing*) para el backend de Fix it!. Utilizamos **Artillery** para simular tráfico masivo de usuarios y asegurar que el servidor y la base de datos (Neon) resistan alta concurrencia.

---

## 🧐 ¿Qué se está probando?

Actualmente, el archivo `artillery.yml` configura un escenario de carga **Read-Heavy** (muchísima lectura). Este simula el caso de uso más común: miles de personas entrando a la app para buscar servicios.

### Fases de la prueba de carga:
1. **Calentamiento (Warm up):** Durante 60 segundos, entran 5 usuarios nuevos por segundo. Sirve para que la base de datos levante caché y el servidor de Render asigne recursos.
2. **Carga sostenida (Sustained load):** Durante 120 segundos, entran 30 nuevos usuarios *por segundo*. Es el ataque de tráfico fuerte.

### El *"Flujo"* del usuario (Scenario):
Cada usuario virtual simulado hace exactamente lo siguiente en milisegundos:
1. Pide la lista de categorías (`GET /api/categories`).
2. Se queda "pensando" (simulando leer) durante 2 segundos.
3. Busca todos los anuncios disponibles (`GET /api/job-posts`).
4. Lee los resultados durante 3 segundos.
5. Intenta realizar una búsqueda específica (`GET /api/job-posts?search=electricista`).

---

## 🛠 ¿Cómo ejecutar las pruebas?

Asegúrate de haber instalado los paquetes de desarrollo corriendo `npm install` en la raíz de `backend/`. Tienes dos comandos a disposición:

### Opción 1: Probar en Local (Recomendado)
Apunta el ataque al servidor corriendo en tu propia computadora (`http://localhost:3000`). Útil para probar cambios rápidos sin gastar cuota de la nube.
```bash
npm run test:load:local
```

### Opción 2: Probar contra Producción (PELIGRO) ⚠️
Dispara la prueba directamente contra el dominio de Render (`https://fix-it-zcgs.onrender.com`).
**Precaución**: Esto consumirá recursos de tu base de datos Neon (lecturas) y estresará tu CPU en Render. Solo utilízalo cuando estés seguro de querer medir la infraestructura real.
```bash
npm run test:load
```

---

## 📊 Entender los Resultados

Al terminar, Artillery escupirá un reporte en la terminal:
* **`http.codes.200`**: Cantidad de respuestas exitosas.
* **`http.codes.400 / 500`**: Si ves esto, significa que el servidor falló por la alta carga o empezó a rechazar conexiones (Rate Limiting).
* **`vusers.created`**: Cuántos usuarios totales se inyectaron.
* **`http.response_time.p95`**: El 95% de los usuarios recibió respuesta más rápido que este tiempo (en milisegundos). Si es >1000ms, el servidor está sufriendo.
