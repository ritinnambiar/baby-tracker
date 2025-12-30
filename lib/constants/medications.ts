// Common baby medications and dosage information

export interface CommonMedication {
  name: string
  category: 'pain-fever' | 'allergy' | 'digestive' | 'vitamin' | 'other'
  commonDosage?: string
  unit: string
  notes?: string
}

export const COMMON_MEDICATIONS: CommonMedication[] = [
  // Pain & Fever
  {
    name: 'Acetaminophen (Tylenol)',
    category: 'pain-fever',
    commonDosage: '2.5-5',
    unit: 'ml',
    notes: 'For pain and fever relief. Consult pediatrician for exact dosage based on weight.',
  },
  {
    name: 'Ibuprofen (Advil, Motrin)',
    category: 'pain-fever',
    commonDosage: '2.5-5',
    unit: 'ml',
    notes: 'For pain and fever. Not for babies under 6 months. Consult doctor.',
  },

  // Digestive
  {
    name: 'Simethicone (Gas Drops)',
    category: 'digestive',
    commonDosage: '0.3-0.6',
    unit: 'ml',
    notes: 'For gas relief',
  },
  {
    name: 'Gripe Water',
    category: 'digestive',
    commonDosage: '5',
    unit: 'ml',
    notes: 'For colic and gas',
  },
  {
    name: 'Probiotics',
    category: 'digestive',
    commonDosage: '5',
    unit: 'drops',
    notes: 'For digestive health',
  },

  // Vitamins
  {
    name: 'Vitamin D Drops',
    category: 'vitamin',
    commonDosage: '1',
    unit: 'ml',
    notes: 'Daily vitamin D supplementation',
  },
  {
    name: 'Iron Supplement',
    category: 'vitamin',
    commonDosage: '1',
    unit: 'ml',
    notes: 'If recommended by doctor',
  },
  {
    name: 'Multivitamin Drops',
    category: 'vitamin',
    commonDosage: '1',
    unit: 'ml',
    notes: 'Complete vitamin supplement',
  },

  // Allergy
  {
    name: 'Diphenhydramine (Benadryl)',
    category: 'allergy',
    commonDosage: '2.5',
    unit: 'ml',
    notes: 'For allergic reactions. Consult doctor first.',
  },
  {
    name: 'Cetirizine (Zyrtec)',
    category: 'allergy',
    commonDosage: '2.5',
    unit: 'ml',
    notes: 'For allergies. For babies 6+ months.',
  },

  // Other
  {
    name: 'Saline Nasal Drops',
    category: 'other',
    commonDosage: '2-3',
    unit: 'drops',
    notes: 'For nasal congestion',
  },
  {
    name: 'Diaper Rash Cream',
    category: 'other',
    unit: 'application',
    notes: 'Apply as needed',
  },
]

export const MEDICATION_CATEGORIES = [
  { value: 'pain-fever', label: 'Pain & Fever' },
  { value: 'digestive', label: 'Digestive' },
  { value: 'vitamin', label: 'Vitamins' },
  { value: 'allergy', label: 'Allergy' },
  { value: 'other', label: 'Other' },
] as const

export function getMedicationsByCategory(category: string): CommonMedication[] {
  return COMMON_MEDICATIONS.filter((m) => m.category === category)
}

export function getCategoryLabel(category: string): string {
  const cat = MEDICATION_CATEGORIES.find((c) => c.value === category)
  return cat?.label || category
}
