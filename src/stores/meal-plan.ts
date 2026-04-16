import { create } from 'zustand'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealEntry = {
  foodId: string
  grams: number
}

type MealPlanStore = {
  meals: Record<MealType, MealEntry[]>
  addFood: (meal: MealType, foodId: string, grams?: number) => void
  removeFood: (meal: MealType, index: number) => void
  updateGrams: (meal: MealType, index: number, grams: number) => void
  reset: () => void
}

const emptyMeals: Record<MealType, MealEntry[]> = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
}

export const useMealPlanStore = create<MealPlanStore>((set) => ({
  meals: emptyMeals,
  addFood: (meal, foodId, grams = 100) =>
    set((state) => ({
      meals: {
        ...state.meals,
        [meal]: [...state.meals[meal], { foodId, grams }],
      },
    })),
  removeFood: (meal, index) =>
    set((state) => ({
      meals: {
        ...state.meals,
        [meal]: state.meals[meal].filter((_, i) => i !== index),
      },
    })),
  updateGrams: (meal, index, grams) =>
    set((state) => ({
      meals: {
        ...state.meals,
        [meal]: state.meals[meal].map((entry, i) =>
          i === index ? { ...entry, grams } : entry,
        ),
      },
    })),
  reset: () => set({ meals: emptyMeals }),
}))