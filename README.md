# MenuSemanal

Planificador semanal de comidas para 2 personas: calendario semanal, recetario y lista
de la compra automática. React + Vite, sin backend — todo se guarda en `localStorage`.
Instalable como PWA y funcional offline.

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura

- `src/data/` — recetario, catálogo de ingredientes, semana y productos iniciales.
- `src/store/useStore.js` — estado global (Zustand + persistencia en localStorage).
- `src/utils/shoppingCalculator.js` — cálculo de la lista de la compra a partir del calendario.
- `src/utils/print.js` — descarga/impresión de una receta o del menú semanal completo.
- `src/components/week` — calendario semanal con arrastrar y soltar (drag & drop) de recetas.
- `src/components/recipes`, `src/components/shopping` — recetario y lista de la compra.
- `src/assets/recipes/` — fotos de cada receta (ver más abajo).
- `src/services/recipeProviders/` — bancos de recetas online (ver más abajo).

## Fotos de las recetas

`scripts/fetch-recipe-images.mjs` descarga una vez una foto por receta desde Wikimedia
Commons (contenido de reuso libre) y la guarda optimizada en `src/assets/recipes/`, junto
con su atribución en `src/data/recipeImageCredits.json` (visible en Ajustes → Créditos de
las fotos). Las recetas nuevas sin foto muestran automáticamente un degradado con icono.

Para añadir/actualizar fotos:

```bash
node scripts/fetch-recipe-images.mjs                 # solo las que falten
node scripts/fetch-recipe-images.mjs --force id1 id2 # forzar una receta concreta
```

Los términos de búsqueda por receta se definen en el propio script (objeto `QUERIES`).

## Bancos de recetas online

Además del recetario local (33 recetas), tanto el recetario como el buscador al añadir
un plato al calendario permiten buscar en bancos de recetas online:

- **TheMealDB** — activo sin configuración (API pública gratuita).
- **Spoonacular** y **Edamam** — se activan pegando tu propia API key gratuita en
  Ajustes → Bancos de recetas online. Sin key, esos dos se omiten en silencio.

Cómo encaja en el resto de la app:

- `src/services/recipeProviders/{mealdb,spoonacular,edamam}.js` — un adaptador por banco,
  normaliza cada respuesta a la misma forma que una receta local (id con prefijo
  `mealdb:`/`spoonacular:`/`edamam:`, imagen, ingredientes, pasos si los hay).
- `src/services/recipeSearch.js` — lanza los bancos activos en paralelo (`Promise.allSettled`,
  uno que falle no tumba a los demás) — se llama solo cuando el usuario pulsa "Buscar
  online" (no en cada tecla), para no gastar la cuota diaria de Spoonacular/Edamam.
- `src/utils/ingredientMatch.js` — clasifica cada ingrediente en texto libre (inglés o
  español) en una de las categorías de la compra por palabras clave. No los une con los
  ingredientes canónicos del recetario local, así que un mismo producto en dos idiomas
  puede aparecer como dos líneas separadas en la lista de la compra.
- Al ver o añadir una receta online se guarda una copia completa en el store
  (`externalRecipes`, en `src/store/useStore.js`) para que siga disponible sin red desde
  el calendario, la lista de la compra y el PDF — `src/utils/recipeLookup.js` centraliza
  esa búsqueda (local primero, cache externa después). La foto de una receta online no se
  descarga (se enlaza al CDN del banco), así que si no hay conexión se ve el hueco en
  blanco pero el resto de la ficha funciona igual.
- Edamam no da pasos de preparación, solo enlaza a la receta original; la ficha lo
  muestra como un enlace en vez de una lista numerada.

## Importar receta (manual o con IA)

Botón "Importar receta" en el recetario, con cuatro modos:

- **Manual** — formulario en blanco (nombre, categoría, raciones, ingredientes, pasos),
  no necesita ninguna clave.
- **Texto** / **URL** / **Foto** — el motor de IA elegido en Ajustes lee el contenido y
  rellena ese mismo formulario para que lo revises antes de guardar.

### Motor de IA (elegible en Ajustes → Importar con IA)

Cuatro motores, todos bring-your-own-key (la clave se guarda solo en este dispositivo y
se llama directamente desde el navegador — sin backend propio):

- **Claude** (Anthropic) — `claude-opus-5`, salida estructurada garantizada
  (`client.messages.parse` + `zodOutputFormat`, SDK oficial). console.anthropic.com/settings/keys.
- **Gemini** (Google) — `gemini-2.0-flash` por defecto (editable), REST directo con
  `response_schema` para forzar JSON. Tiene uso gratuito diario generoso.
  aistudio.google.com/apikey.
- **Mistral** — `mistral-small-latest` por defecto (editable), REST directo
  (`response_format: json_object`, sin schema estricto documentado — el JSON se pide
  también en el prompt). console.mistral.ai/api-keys.
- **OpenRouter** — proxy a cientos de modelos; aquí el modelo es **obligatorio** (no hay
  un "por defecto" razonable dado lo cambiante del catálogo) — se indica en Ajustes,
  p.ej. `google/gemini-2.0-flash-001`. openrouter.ai/keys y openrouter.ai/models.

Cómo encaja:

- `src/services/aiProviders/{claude,gemini,mistral,openrouter}.js` — un adaptador por
  motor, misma firma (`extract({ instructionText, bodyText, image, apiKey, model })`),
  cada uno construye la petición REST/SDK de su proveedor y devuelve el mismo objeto
  JSON intermedio. El SDK de Claude + zod se cargan con `import()` dinámico solo al
  usarse; Gemini/Mistral/OpenRouter son `fetch()` puro, sin dependencias.
- `src/services/aiRecipeImport.js` — orquesta: arma el prompt compartido, despacha al
  adaptador según `settings.aiEngine` (`getAiConfig`), y normaliza el resultado a receta
  externa (`source: 'ai'`, prefijo de id `ai:`) igual que hacen `custom:` (manual) y los
  bancos online — mismo `externalRecipes` del store, así que funciona igual en el
  calendario, la lista de la compra y el PDF.
- Para **URL**, no hay backend propio que evite CORS: se usa `r.jina.ai` (gratis, sin
  clave, responde con CORS abierto) para convertir la página en texto limpio antes de
  pasárselo al motor elegido.
- Verificado con los 4 motores usando una clave inválida: la petición llega bien a cada
  API (CORS abierto en las 4 — confirmado con curl `-H "Origin: ..."`) y da el error de
  autenticación esperado, sin errores de CORS ni de JS. No se ha podido probar una
  extracción real con clave válida en desarrollo — si algo no encaja al usarlo (forma de
  la respuesta, nombre de modelo caducado, etc.), revisa el adaptador de ese motor.
