import { useForm, useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { dietaryConstraints } from "@/data/constraints";
import { cn } from "@/lib/utils";
import { usePatientStore } from "@/stores/patient";

export const Route = createFileRoute("/new-patient/")({
	component: NewPatientPage,
});

type ConstraintOption = {
	id: string;
	label: string;
	kind: "condition" | "allergy";
};
const CONSTRAINT_OPTIONS: ConstraintOption[] = [
	...Object.entries(dietaryConstraints.conditions).map(([id, value]) => ({
		id: `condition:${id}`,
		label: value.display_name,
		kind: "condition" as const,
	})),
	...Object.entries(dietaryConstraints.allergies).map(([id, value]) => ({
		id: `allergy:${id}`,
		label: value.display_name,
		kind: "allergy" as const,
	})),
];
type ComputedConstraint = {
	key: string;
	nutrient: string;
	value: number;
	unit: string;
	scope: string;
};

function humanizeKey(key: string): string {
	const map: Record<string, string> = {
		carbs_g_per_meal: "Carbohydrates",
		carbs_g_per_day: "Carbohydrates",
		protein_g_per_kg_per_day: "Protein",
		fiber_g_per_day: "Fiber",
		sodium_mg_per_day: "Sodium",
		potassium_mg_per_day: "Potassium",
		phosphorus_mg_per_day: "Phosphorus",
		calcium_mg_per_day: "Calcium",
		fluid_ml_per_day: "Fluid",
		energy_kcal_per_kg_per_day: "Energy",
	};
	return map[key] ?? key.replace(/_/g, " ");
}

function computeConstraints(
	selectedConditions: string[],
	weightKg: number,
): ComputedConstraint[] {
	const merged: Record<string, ComputedConstraint> = {};

	for (const id of selectedConditions) {
		// only process conditions, not allergies
		if (!id.startsWith("condition:")) continue;
		const condKey = id.replace("condition:", "");
		const condition =
			dietaryConstraints.conditions[
				condKey as keyof typeof dietaryConstraints.conditions
			];
		if (!condition) continue;

		for (const [cKey, rule] of Object.entries(condition.constraints)) {
			const r = rule as {
				min?: number;
				max?: number;
				unit: string;
				scope: string;
			};

			// Get the constraint value (prefer max, fall back to min)
			let value = r.max ?? r.min ?? 0;

			// Convert per-kg values to absolute using patient weight
			if (r.unit === "g/kg" || r.unit === "kcal/kg") {
				value = Math.round(value * weightKg);
			}

			const resolvedUnit =
				r.unit === "g/kg" ? "g" : r.unit === "kcal/kg" ? "kcal" : r.unit;

			const existing = merged[cKey];
			if (!existing) {
				merged[cKey] = {
					key: cKey,
					nutrient: humanizeKey(cKey),
					value,
					unit: resolvedUnit,
					scope: r.scope,
				};
			} else {
				// When two conditions set the same nutrient, stricter (lower) wins
				if (value < existing.value) {
					existing.value = value;
				}
			}
		}
	}

	return Object.values(merged);
}

function NewPatientPage() {
	const navigate = useNavigate();
	const [conditionsOpen, setConditionsOpen] = useState(false); // ← lifted out
	const setPatient = usePatientStore((s) => s.setPatient);

	const form = useForm({
		defaultValues: {
			patientName: "",
			weightKg: "",
			heightCm: "",
			conditions: [] as string[],
		},
		onSubmit: async ({ value }) => {
			console.log("New patient:", {
				...value,
				weightKg: Number(value.weightKg),
				heightCm: Number(value.heightCm),
			});
			// TODO: call API with useMutation, then:
			// navigate({ to: '/meal-plan' })
			setPatient({
				name: value.patientName,
				weightKg: Number(value.weightKg),
				conditions: value.conditions.filter((c) => c.startsWith("condition:")),
				allergies: value.conditions.filter((c) => c.startsWith("allergy:")),
			});
			navigate({ to: "/meal-planner/" });
		},
	});
	// Watch the form values reactively
	const conditions = useStore(form.store, (s) => s.values.conditions);
	const weightStr = useStore(form.store, (s) => s.values.weightKg);
	const weightKg = Number(weightStr) || 0;

	// Recomputes automatically when conditions or weight change
	const generatedConstraints = useMemo(
		() => computeConstraints(conditions, weightKg),
		[conditions, weightKg],
	);

	return (
		<div className="mx-auto max-w-3xl p-6">
			<Card>
				<CardHeader>
					<CardTitle>Create New Patient Profile</CardTitle>
					<CardDescription>
						Enter patient details and select active conditions
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						{/* Patient Name */}
						<form.Field
							name="patientName"
							validators={{
								onChange: ({ value }) =>
									!value ? "Patient name is required" : undefined,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Patient Name</Label>
									<Input
										id={field.name}
										placeholder="Enter patient name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Weight */}
						<form.Field
							name="weightKg"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Weight is required";
									const n = Number(value);
									if (Number.isNaN(n) || n <= 0)
										return "Weight must be greater than 0";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Weight (kg)</Label>
									<Input
										id={field.name}
										type="number"
										step="0.1"
										placeholder="Enter weight in kilograms"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Height */}
						<form.Field
							name="heightCm"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Height is required";
									const n = Number(value);
									if (Number.isNaN(n) || n <= 0)
										return "Height must be greater than 0";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Height (cm)</Label>
									<Input
										id={field.name}
										type="number"
										step="0.1"
										placeholder="Enter height in centimeters"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Active Conditions */}
						<form.Field name="conditions">
							{(field) => {
								const selected = CONSTRAINT_OPTIONS.filter((opt) =>
									field.state.value.includes(opt.id),
								);

								const toggle = (id: string) => {
									field.handleChange(
										field.state.value.includes(id)
											? field.state.value.filter((v) => v !== id)
											: [...field.state.value, id],
									);
								};

								return (
									<div className="space-y-2">
										<Label>Active Conditions & Allergies</Label>

										{selected.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{selected.map((opt) => (
													<Badge
														key={opt.id}
														variant="secondary"
														className="gap-1 pr-1"
													>
														{opt.label}
														<button
															type="button"
															onClick={() => toggle(opt.id)}
															className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
															aria-label={`Remove ${opt.label}`}
														>
															<X className="h-3 w-3" />
														</button>
													</Badge>
												))}
											</div>
										)}

										<Popover
											open={conditionsOpen}
											onOpenChange={setConditionsOpen}
										>
											<PopoverTrigger
												render={
													<Button
														type="button"
														variant="outline"
														className="w-full justify-start text-muted-foreground font-normal"
													>
														Search conditions or allergies…
													</Button>
												}
											/>

											<PopoverContent
												className="w-[--radix-popover-trigger-width] p-0"
												align="start"
											>
												<Command>
													<CommandInput placeholder="Type to search…" />
													<CommandList>
														<CommandEmpty>No matches found.</CommandEmpty>

														<CommandGroup heading="Conditions">
															{CONSTRAINT_OPTIONS.filter(
																(o) => o.kind === "condition",
															).map((opt) => (
																<CommandItem
																	key={opt.id}
																	value={opt.label}
																	onSelect={() => toggle(opt.id)}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			field.state.value.includes(opt.id)
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{opt.label}
																</CommandItem>
															))}
														</CommandGroup>

														<CommandGroup heading="Allergies">
															{CONSTRAINT_OPTIONS.filter(
																(o) => o.kind === "allergy",
															).map((opt) => (
																<CommandItem
																	key={opt.id}
																	value={opt.label}
																	onSelect={() => toggle(opt.id)}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			field.state.value.includes(opt.id)
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{opt.label}
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
									</div>
								);
							}}
						</form.Field>
						{/* ---- Generated Constraints ---- */}
						{generatedConstraints.length > 0 && (
							<div className="space-y-3 pt-4">
								<h3 className="font-semibold">Generated Constraints</h3>
								<ul className="space-y-1 text-sm">
									{generatedConstraints.map((c) => (
										<li key={c.key} className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
											<span>
												{c.nutrient} per {c.scope === "meal" ? "Meal" : "Day"}:{" "}
												<strong>
													{c.value} {c.unit}
												</strong>
											</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Buttons */}
						<div className="flex gap-3 pt-2">
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										className="flex-1"
										disabled={!canSubmit}
									>
										{isSubmitting ? "Saving…" : "Save & Start Planning"}
									</Button>
								)}
							</form.Subscribe>
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/" })}
							>
								Cancel
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}