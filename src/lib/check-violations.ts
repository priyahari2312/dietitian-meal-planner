import { computeConstraints } from "@/lib/compute-constraints";
import { calculateTotals, getNutrientFromTotals } from "@/lib/nutrition-values";
import type { MealEntry } from "@/stores/meal-plan";

export type ConstraintViolation = {
	nutrient: string;
	actual: number;
	max: number;
	unit: string;
	scope: "meal" | "day";
	mealName?: string;
};

export function checkViolations(
	conditions: string[],
	weightKg: number,
	meals: Record<string, MealEntry[]>,
	dailyTotals: ReturnType<typeof calculateTotals>,
): ConstraintViolation[] {
	const violations: ConstraintViolation[] = [];
	const computed = computeConstraints(conditions, weightKg);

	// Check per-day constraints
	for (const c of computed) {
		if (c.scope !== "day") continue;
		const actualValue = getNutrientFromTotals(dailyTotals, c.key);
		if (actualValue > c.value) {
			violations.push({
				nutrient: c.nutrient,
				actual: actualValue,
				max: c.value,
				unit: c.unit,
				scope: "day",
			});
		}
	}

	// Check per-meal constraints
	for (const c of computed) {
		if (c.scope !== "meal") continue;
		for (const [mealType, entries] of Object.entries(meals)) {
			const mealTotals = calculateTotals(entries);
			const actualValue = getNutrientFromTotals(mealTotals, c.key);
			if (actualValue > c.value) {
				violations.push({
					nutrient: c.nutrient,
					actual: actualValue,
					max: c.value,
					unit: c.unit,
					scope: "meal",
					mealName: mealType.charAt(0).toUpperCase() + mealType.slice(1),
				});
			}
		}
	}

	return violations;
}