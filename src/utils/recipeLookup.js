// Busca una receta por id tanto en el recetario local como en las recetas
// externas cacheadas (bancos online, importadas, o ediciones del usuario).
// Centraliza esto en un solo sitio para que el calendario, la lista de la
// compra y el PDF funcionen igual sin importar de dónde venga la receta.
//
// externalRecipes tiene prioridad: cuando el usuario edita una receta del
// catálogo local (botón "Editar"), se guarda ahí un override con el MISMO id
// — así el resto de la app (calendario, favoritos, lista de la compra) sigue
// funcionando sin cambiar ninguna referencia.
import { getRecipe } from '../data/recipes'
import { useStore } from '../store/useStore'

export function getAnyRecipe(id) {
  if (!id) return null
  const override = useStore.getState().externalRecipes[id]
  if (override) return override
  return getRecipe(id) || null
}
