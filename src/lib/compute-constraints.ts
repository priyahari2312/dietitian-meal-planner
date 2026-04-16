import { dietaryConstraints } from '@/data/constraints'

export type ComputedConstraint = {
  key: string
  nutrient: string
  value: number
  unit: string
  scope: string
}

export function humanizeKey(key: string): string {
  const map: Record<string, string> = {
    carbs_g_per_meal: 'Carbohydrates',
    carbs_g_per_day: 'Carbohydrates',
    protein_g_per_kg_per_day: 'Protein',
    fiber_g_per_day: 'Fiber',
    sodium_mg_per_day: 'Sodium',
    potassium_mg_per_day: 'Potassium',
    phosphorus_mg_per_day: 'Phosphorus',
    calcium_mg_per_day: 'Calcium',
    fluid_ml_per_day: 'Fluid',
    energy_kcal_per_kg_per_day: 'Energy',
  }
  return map[key] ?? key.replace(/_/g, ' ')
}

export function computeConstraints(
  selectedConditions: string[],
  weightKg: number,
): ComputedConstraint[] {
  const merged: Record<string, ComputedConstraint> = {}

  for (const id of selectedConditions) {
    if (!id.startsWith('condition:')) continue
    const condKey = id.replace('condition:', '')
    const condition =
      dietaryConstraints.conditions[
        condKey as keyof typeof dietaryConstraints.conditions
      ]
    if (!condition) continue

    for (const [cKey, rule] of Object.entries(condition.constraints)) {
      const r = rule as { min?: number; max?: number; unit: string; scope: string }
      let value = r.max ?? r.min ?? 0

      if (r.unit === 'g/kg' || r.unit === 'kcal/kg') {
        value = Math.round(value * weightKg)
      }

      const resolvedUnit =
        r.unit === 'g/kg' ? 'g' : r.unit === 'kcal/kg' ? 'kcal' : r.unit

      const existing = merged[cKey]
      if (!existing) {
        merged[cKey] = {
          key: cKey,
          nutrient: humanizeKey(cKey),
          value,
          unit: resolvedUnit,
          scope: r.scope,
        }
      } else if (value < existing.value) {
        existing.value = value
      }
    }
  }

  return Object.values(merged)
}