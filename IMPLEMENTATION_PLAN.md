# Plan completo para el rediseño del tablero y la incorporación de comentarios

He elaborado una guía paso a paso que cubre desde la base de datos hasta la UI, manteniendo el badge clicable, los filtros de estado, y añadiendo comentarios con fecha, paginación y colapso. Aquí tienes el desglose de las tareas para llevarlo a cabo:

## 1. 📦 Cambios en el modelo de datos
- Añadir columna `comments` (texto JSON, `default []`) a la tabla `todos`.
- Crear migración en `index.js` que compruebe y aplique el `ALTER TABLE`.
- Definir los comentarios como `{text: string, date: string}`.
- Asegurarse de inicializar `comments: []` en todos los objetos existentes (cliente/servidor).

## 2. 🔧 Backend
- Actualizar todos los endpoints (`GET /todos`, `POST /todos`, `/sync`, `/migrate`, `PUT /todos/:id`) para aceptar y devolver `comments`.
- Serializar/parsear JSON al escribir y leer de la base de datos.
- Durante el arranque, poblar `comments` con `'[]'` donde falte.
- Añadir ejemplos de uso con comentarios en `API.md`.

## 3. 🖥 Frontend
- Extender cada todo con `comments: []` y modificar `migrateTodos()`.
- Rediseñar `renderTodos()`:
    - Tres contenedores columnares (Plan, To Do, Done).
    - Tarjetas con badge, texto, categoría, botón borrar.
    - Botón para mostrar/ocultar sección de comentarios.
- Implementar drag‑and‑drop para mover tarjetas entre columnas y actualizar `todo.state`.
- Mantener el badge clicable para cambiar estado.
- Añadir UI de comentarios:
    - Listado con fecha.
    - Input para añadir (fecha generada en el cliente).
    - Paginación y colapsado si hay muchas entradas.
- Conservar filtros de estado y categoría; filtran columnas/tarjetas en el tablero.

## 4. 🎨 CSS
- Diseñar `.kanban-board`, `.column`, `.card` con estilo de tablero.
- Añadir estilos para `drag‑over`, comentarios (`.comments-container`, `.comment`, etc.).
- Gestores de tema light/dark siguen aplicándose.
- Añadir paginación/colapso estilizados.

## 5. 🧾 Documentación
- Actualizar `PRODUCT.md`, `ARCHITECTURE.md`, `API.md`, `MIGRATION.md` y `README.md` explicando el board Kanban y los comentarios.
- Incluir instrucciones para usuarios (añadir, ver, paginar comentarios) y para desarrolladores (migración de datos).

## 6. ✅ Pruebas & despliegue
- Verificar manualmente: crear tareas, comentar, mover, sincronizar.
- Asegurar que filtros y badge continúan funcionando.
- Probar migración de datos existente sin pérdida.
- Desplegar backend con migración antes que el frontend; monitorizar errores.

### ❓ Consideraciones abiertas
- El badge sigue existiendo y funcional.
- Los comentarios llevan solo una fecha, no autor.
- Los listados de comentarios largos se paginarán y podrán colapsarse.
- Los filtros por estado se mantienen, aunque el tablero ya representa el estado.

💡 **Resultado:** una hoja de ruta clara y detallada para convertir la lista en un tablero Kanban con tareas arrastrables y comentarios con fecha, manteniendo todas las funcionalidades actuales y la sincronización offline/online.

