import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Patient = {
  name: string
  weightKg: number
  conditions: string[]   // e.g. ["condition:type_2_diabetes"]
  allergies: string[]    // e.g. ["allergy:peanut"]
}

type PatientStore = {
  patient: Patient | null
  setPatient: (patient: Patient) => void
  clearPatient: () => void
}

export const usePatientStore = create<PatientStore>()(
  persist(
    (set) => ({
      patient: null,
      setPatient: (patient) => set({ patient }),
      clearPatient: () => set({ patient: null }),
    }),
    { name: 'patient-storage' },
  ),
)