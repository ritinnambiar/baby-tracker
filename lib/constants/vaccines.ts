// Standard CDC/WHO Vaccination Schedule
export interface VaccineTemplate {
  name: string
  ageMonths: number
  description: string
  doses?: number
}

export const VACCINE_SCHEDULE: VaccineTemplate[] = [
  // Birth
  {
    name: 'Hepatitis B (HepB)',
    ageMonths: 0,
    description: 'First dose - protects against Hepatitis B',
    doses: 1
  },

  // 2 Months
  {
    name: 'DTaP',
    ageMonths: 2,
    description: 'Diphtheria, Tetanus, and Pertussis (whooping cough)',
    doses: 1
  },
  {
    name: 'Hib',
    ageMonths: 2,
    description: 'Haemophilus influenzae type b',
    doses: 1
  },
  {
    name: 'IPV (Polio)',
    ageMonths: 2,
    description: 'Inactivated Poliovirus',
    doses: 1
  },
  {
    name: 'PCV13',
    ageMonths: 2,
    description: 'Pneumococcal conjugate',
    doses: 1
  },
  {
    name: 'Rotavirus',
    ageMonths: 2,
    description: 'Protects against rotavirus',
    doses: 1
  },

  // 4 Months
  {
    name: 'DTaP',
    ageMonths: 4,
    description: 'Second dose',
    doses: 2
  },
  {
    name: 'Hib',
    ageMonths: 4,
    description: 'Second dose',
    doses: 2
  },
  {
    name: 'IPV (Polio)',
    ageMonths: 4,
    description: 'Second dose',
    doses: 2
  },
  {
    name: 'PCV13',
    ageMonths: 4,
    description: 'Second dose',
    doses: 2
  },
  {
    name: 'Rotavirus',
    ageMonths: 4,
    description: 'Second dose',
    doses: 2
  },

  // 6 Months
  {
    name: 'DTaP',
    ageMonths: 6,
    description: 'Third dose',
    doses: 3
  },
  {
    name: 'Hib',
    ageMonths: 6,
    description: 'Third dose',
    doses: 3
  },
  {
    name: 'IPV (Polio)',
    ageMonths: 6,
    description: 'Third dose',
    doses: 3
  },
  {
    name: 'PCV13',
    ageMonths: 6,
    description: 'Third dose',
    doses: 3
  },
  {
    name: 'Rotavirus',
    ageMonths: 6,
    description: 'Third dose (if needed)',
    doses: 3
  },
  {
    name: 'Hepatitis B (HepB)',
    ageMonths: 6,
    description: 'Second dose (6-18 months)',
    doses: 2
  },
  {
    name: 'Influenza (Flu)',
    ageMonths: 6,
    description: 'Annual flu shot starts at 6 months',
    doses: 1
  },

  // 12 Months
  {
    name: 'MMR',
    ageMonths: 12,
    description: 'Measles, Mumps, and Rubella',
    doses: 1
  },
  {
    name: 'Varicella (Chickenpox)',
    ageMonths: 12,
    description: 'Protects against chickenpox',
    doses: 1
  },
  {
    name: 'Hepatitis A',
    ageMonths: 12,
    description: 'First dose (12-23 months)',
    doses: 1
  },
  {
    name: 'PCV13',
    ageMonths: 12,
    description: 'Fourth dose (12-15 months)',
    doses: 4
  },
  {
    name: 'Hib',
    ageMonths: 12,
    description: 'Fourth dose (12-15 months)',
    doses: 4
  },

  // 15 Months
  {
    name: 'DTaP',
    ageMonths: 15,
    description: 'Fourth dose (15-18 months)',
    doses: 4
  },

  // 18 Months
  {
    name: 'Hepatitis A',
    ageMonths: 18,
    description: 'Second dose (6-18 months after first)',
    doses: 2
  },
  {
    name: 'Hepatitis B (HepB)',
    ageMonths: 18,
    description: 'Third dose (if not given earlier)',
    doses: 3
  },
]

export function getVaccinesByAge(ageMonths: number): VaccineTemplate[] {
  return VACCINE_SCHEDULE.filter(v => v.ageMonths === ageMonths)
}

export function getUpcomingVaccines(currentAgeMonths: number): VaccineTemplate[] {
  return VACCINE_SCHEDULE.filter(v => v.ageMonths > currentAgeMonths)
    .sort((a, b) => a.ageMonths - b.ageMonths)
}

export function getAgeLabel(months: number): string {
  if (months === 0) return 'At Birth'
  if (months === 1) return '1 Month'
  if (months < 12) return `${months} Months`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`
  return `${years} ${years === 1 ? 'Year' : 'Years'} ${remainingMonths} ${remainingMonths === 1 ? 'Month' : 'Months'}`
}
