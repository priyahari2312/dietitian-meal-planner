import { FOODS } from "@/data/foods";
import type { MealEntry } from "@/stores/meal-plan";

export type Totals = {
	calories_kcal: number;
	carbs_g: number;
	protein_g: number;
	fat_g: number;
	fiber_g: number;
	sodium_mg: number;
	potassium_mg: number;
	phosphorus_mg: number;
};

export const emptyTotals: Totals = {
	calories_kcal: 0,
	carbs_g: 0,
	protein_g: 0,
	fat_g: 0,
	fiber_g: 0,
	sodium_mg: 0,
	potassium_mg: 0,
	phosphorus_mg: 0,
};

export function calculateTotals(entries: MealEntry[]): Totals {
	return entries.reduce<Totals>((acc, entry) => {
		const food = FOODS.find((f) => f.id === entry.foodId);
		if (!food) return acc;

		const factor = entry.grams / 100; // nutrients are per 100g
		return {
			calories_kcal: acc.calories_kcal + food.calories_kcal * factor,
			carbs_g: acc.carbs_g + food.carbs_g * factor,
			protein_g: acc.protein_g + food.protein_g * factor,
			fat_g: acc.fat_g + food.fat_g * factor,
			fiber_g: acc.fiber_g + food.fiber_g * factor,
			sodium_mg: acc.sodium_mg + food.sodium_mg * factor,
			potassium_mg: acc.potassium_mg + food.potassium_mg * factor,
			phosphorus_mg: acc.phosphorus_mg + food.phosphorus_mg * factor,
		};
	}, emptyTotals);
}

export function getNutrientFromTotals(
	totals: Totals,
	constraintKey: string,
): number {
	if (constraintKey.startsWith("carbs")) return totals.carbs_g;
	if (constraintKey.startsWith("protein")) return totals.protein_g;
	if (constraintKey.startsWith("fiber")) return totals.fiber_g;
	if (constraintKey.startsWith("sodium")) return totals.sodium_mg;
	if (constraintKey.startsWith("potassium")) return totals.potassium_mg;
	if (constraintKey.startsWith("phosphorus")) return totals.phosphorus_mg;
	return 0; // energy, fluid, calcium not in food data yet
}