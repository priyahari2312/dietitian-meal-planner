import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FOODS } from "@/data/foods";
import { computeConstraints } from "@/lib/compute-constraints";
import type { MealEntry } from "@/stores/meal-plan";
import { type MealType, useMealPlanStore } from "@/stores/meal-plan";
import { usePatientStore } from "@/stores/patient";

export const Route = createFileRoute("/meal-planner/")({
	component: MealPlannerPage,
});

// Types
type Totals = {
	calories_kcal: number;
	carbs_g: number;
	protein_g: number;
	fat_g: number;
	fiber_g: number;
	sodium_mg: number;
	potassium_mg: number;
	phosphorus_mg: number;
};

// Constants
const MEAL_TABS: { value: MealType; label: string }[] = [
	{ value: "breakfast", label: "Breakfast" },
	{ value: "lunch", label: "Lunch" },
	{ value: "dinner", label: "Dinner" },
	{ value: "snack", label: "Snack" },
];

const emptyTotals: Totals = {
	calories_kcal: 0,
	carbs_g: 0,
	protein_g: 0,
	fat_g: 0,
	fiber_g: 0,
	sodium_mg: 0,
	potassium_mg: 0,
	phosphorus_mg: 0,
};

// Helper to calculate totals for a list of meal entries
function calculateTotals(entries: MealEntry[]): Totals {
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
// Helper to get the relevant nutrient value from totals based on constraint key
function getNutrientFromTotals(totals: Totals, constraintKey: string): number {
	if (constraintKey.startsWith("carbs")) return totals.carbs_g;
	if (constraintKey.startsWith("protein")) return totals.protein_g;
	if (constraintKey.startsWith("fiber")) return totals.fiber_g;
	if (constraintKey.startsWith("sodium")) return totals.sodium_mg;
	if (constraintKey.startsWith("potassium")) return totals.potassium_mg;
	if (constraintKey.startsWith("phosphorus")) return totals.phosphorus_mg;
	return 0; // energy, fluid, calcium not in food data yet
}

// Main component
function MealPlannerPage() {
	const navigate = useNavigate();
	const patient = usePatientStore((s) => s.patient);
	const meals = useMealPlanStore((s) => s.meals);
	const addFood = useMealPlanStore((s) => s.addFood);
	const removeFood = useMealPlanStore((s) => s.removeFood);
	const updateGrams = useMealPlanStore((s) => s.updateGrams);

	const [search, setSearch] = useState("");
	const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
	// Compute daily totals (all meals combined)
	const dailyTotals = useMemo(() => {
		const allEntries = Object.values(meals).flat();
		return calculateTotals(allEntries);
	}, [meals]);
	// Compute constraint violations
	const constraintViolations = useMemo(() => {
		if (!patient) return [];
		const violations: Array<{
			nutrient: string;
			actual: number;
			max: number;
			unit: string;
			scope: "meal" | "day";
			mealName?: string;
		}> = [];
		const computed = computeConstraints(patient.conditions, patient.weightKg);

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
	}, [meals, dailyTotals, patient]);

	// Filter foods by search
	const filteredFoods = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return FOODS;
		return FOODS.filter((f) => f.name.toLowerCase().includes(q));
	}, [search]);

	const today = new Date().toISOString().split("T")[0];

	// Redirect to New Patient if no patient is set
	if (!patient) {
		return (
			<div className="p-6 text-center">
				<p className="mb-4">No patient selected.</p>
				<Button onClick={() => navigate({ to: "/new-patient" })}>
					Create Patient
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl p-6 space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<button
						type="button"
						onClick={() => navigate({ to: "/" })}
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</button>
					<h1 className="text-2xl font-bold">Meal Planner</h1>
					<p className="text-sm text-muted-foreground">
						{patient.name} · {patient.weightKg} kg · {today}
					</p>
				</div>
				<Button>Save & Review Plan</Button>
			</div>

			{/* Two-column layout (right side comes next) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* --- Add Foods --- */}
					<Card>
						<CardHeader>
							<CardTitle>Add Foods</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<Input
								type="search"
								placeholder="Search for foods…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>

							{/* Only show results list when there's a search query */}
							{search.trim() !== "" && (
								<ScrollArea className="h-72">
									<div className="space-y-2 pr-2">
										{filteredFoods.length === 0 ? (
											<p className="text-sm text-muted-foreground text-center py-8">
												No foods match "{search}"
											</p>
										) : (
											filteredFoods.map((food) => (
												<div
													key={food.id}
													className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
												>
													<div>
														<div className="font-medium">{food.name}</div>
														<div className="text-sm text-muted-foreground">
															{food.calories_kcal} kcal · {food.carbs_g}g carbs
															· {food.protein_g}g protein (per 100g)
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => {
															addFood(activeMeal, food.id);
															setSearch(""); // clear search after adding
														}}
														aria-label={`Add ${food.name} to ${activeMeal}`}
													>
														<Plus className="h-4 w-4" />
													</Button>
												</div>
											))
										)}
									</div>
								</ScrollArea>
							)}
						</CardContent>
					</Card>

					{/* --- Meals --- */}
					<Card>
						<CardHeader>
							<CardTitle>Meals</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs
								value={activeMeal}
								onValueChange={(v) => setActiveMeal(v as MealType)}
							>
								<TabsList className="grid w-full grid-cols-4">
									{MEAL_TABS.map((tab) => {
										const count = meals[tab.value].length;
										return (
											<TabsTrigger
												key={tab.value}
												value={tab.value}
												className="gap-2"
											>
												{tab.label}
												{count > 0 && (
													<span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted text-xs font-medium">
														{count}
													</span>
												)}
											</TabsTrigger>
										);
									})}
								</TabsList>

								{MEAL_TABS.map((tab) => {
									const entries = meals[tab.value];
									const mealTotals = calculateTotals(entries);

									return (
										<TabsContent
											key={tab.value}
											value={tab.value}
											className="mt-4 space-y-4"
										>
											{entries.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground text-sm">
													<p>No foods added yet</p>
													<p>Search and add foods above</p>
												</div>
											) : (
												<>
													{/* Food entries */}
													<div className="space-y-3">
														{entries.map((entry, idx) => {
															const food = FOODS.find(
																(f) => f.id === entry.foodId,
															);
															if (!food) return null;

															const factor = entry.grams / 100;
															return (
																<div
																	key={`${entry.foodId}-${idx}`}
																	className="rounded-lg border p-4 space-y-3"
																>
																	<div className="flex items-start justify-between">
																		<h4 className="font-semibold">
																			{food.name}
																		</h4>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8"
																			onClick={() => removeFood(tab.value, idx)}
																			aria-label={`Remove ${food.name}`}
																		>
																			<Trash2 className="h-4 w-4 text-destructive" />
																		</Button>
																	</div>

																	<div className="flex items-center gap-2">
																		<Input
																			type="number"
																			min={0}
																			className="w-24 h-9"
																			value={entry.grams}
																			onChange={(e) =>
																				updateGrams(
																					tab.value,
																					idx,
																					Number(e.target.value) || 0,
																				)
																			}
																		/>
																		<span className="text-sm text-muted-foreground">
																			grams
																		</span>
																	</div>

																	<div className="text-sm text-muted-foreground">
																		{Math.round(food.calories_kcal * factor)}{" "}
																		kcal · {(food.carbs_g * factor).toFixed(1)}g
																		carbs ·{" "}
																		{(food.protein_g * factor).toFixed(1)}g
																		protein · {(food.fat_g * factor).toFixed(1)}
																		g fat
																	</div>
																</div>
															);
														})}
													</div>

													{/* Meal totals */}
													<div className="pt-4 border-t space-y-2">
														<h4 className="font-semibold">Meal Totals:</h4>
														<div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
															<div>
																Calories: {Math.round(mealTotals.calories_kcal)}{" "}
																kcal
															</div>
															<div>Carbs: {mealTotals.carbs_g.toFixed(1)}g</div>
															<div>
																Protein: {mealTotals.protein_g.toFixed(1)}g
															</div>
															<div>Fat: {mealTotals.fat_g.toFixed(1)}g</div>
															<div>
																Potassium: {Math.round(mealTotals.potassium_mg)}
																mg
															</div>
															<div>
																Sodium: {Math.round(mealTotals.sodium_mg)}mg
															</div>
														</div>
													</div>
												</>
											)}
										</TabsContent>
									);
								})}
							</Tabs>
						</CardContent>
					</Card>
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Daily Totals */}
					<Card>
						<CardHeader>
							<CardTitle>Daily Totals</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
								<div>
									<div className="text-muted-foreground">Calories</div>
									<div className="font-medium">
										{Math.round(dailyTotals.calories_kcal)} kcal
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Carbs</div>
									<div className="font-medium">
										{dailyTotals.carbs_g.toFixed(1)}g
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Protein</div>
									<div className="font-medium">
										{dailyTotals.protein_g.toFixed(1)}g
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Fat</div>
									<div className="font-medium">
										{dailyTotals.fat_g.toFixed(1)}g
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Potassium</div>
									<div className="font-medium">
										{Math.round(dailyTotals.potassium_mg)} mg
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Sodium</div>
									<div className="font-medium">
										{Math.round(dailyTotals.sodium_mg)} mg
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Phosphorus</div>
									<div className="font-medium">
										{Math.round(dailyTotals.phosphorus_mg)} mg
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Fiber</div>
									<div className="font-medium">
										{dailyTotals.fiber_g.toFixed(1)}g
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Active Constraints */}
					<Card>
						<CardHeader>
							<CardTitle>Active Constraints</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{patient.conditions.map((id) => (
									<Badge key={id} variant="secondary">
										{id.replace("condition:", "").replace(/_/g, "-")}
									</Badge>
								))}
								{patient.conditions.length === 0 && (
									<span className="text-sm text-muted-foreground">None</span>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Constraint Status */}
					<Card>
						<CardHeader>
							<CardTitle>Constraint Status</CardTitle>
						</CardHeader>
						<CardContent>
							{constraintViolations.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-4 text-center">
									<div className="w-12 h-12 rounded-full border-2 border-green-600 flex items-center justify-center mb-2">
										<Check className="h-6 w-6 text-green-600" />
									</div>
									<p className="text-green-700 font-medium">
										All constraints met
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{constraintViolations.map((v) => (
										<div
											key={`${v.nutrient}-${v.scope}-${v.mealName ?? "all"}`}
											className="flex gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
										>
											<AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
											<div className="text-sm">
												<div className="font-medium">
													{v.nutrient} per {v.scope}
												</div>
												<div className="text-muted-foreground">
													{v.actual.toFixed(1)} {v.unit} / {v.max} {v.unit}
												</div>
												{v.mealName && (
													<div className="text-xs text-muted-foreground">
														{v.mealName}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
