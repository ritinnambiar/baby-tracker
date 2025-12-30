// Common developmental milestones by category and age range

export interface MilestoneTemplate {
  title: string
  category: 'physical' | 'cognitive' | 'social' | 'language'
  ageMonthsMin: number
  ageMonthsMax: number
  description: string
}

export const MILESTONE_CATEGORIES = [
  { value: 'physical', label: 'Physical', emoji: '🤸' },
  { value: 'cognitive', label: 'Cognitive', emoji: '🧠' },
  { value: 'social', label: 'Social & Emotional', emoji: '❤️' },
  { value: 'language', label: 'Language', emoji: '💬' },
] as const

export const COMMON_MILESTONES: MilestoneTemplate[] = [
  // 0-3 Months
  {
    title: 'Lifts head during tummy time',
    category: 'physical',
    ageMonthsMin: 0,
    ageMonthsMax: 3,
    description: 'Can lift head briefly when lying on stomach',
  },
  {
    title: 'Smiles at people',
    category: 'social',
    ageMonthsMin: 1,
    ageMonthsMax: 3,
    description: 'Begins to smile at familiar faces',
  },
  {
    title: 'Makes cooing sounds',
    category: 'language',
    ageMonthsMin: 1,
    ageMonthsMax: 3,
    description: 'Makes soft cooing or gurgling sounds',
  },
  {
    title: 'Tracks objects with eyes',
    category: 'cognitive',
    ageMonthsMin: 1,
    ageMonthsMax: 3,
    description: 'Follows moving objects with eyes',
  },

  // 4-6 Months
  {
    title: 'Rolls over',
    category: 'physical',
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    description: 'Can roll from tummy to back and back to tummy',
  },
  {
    title: 'Sits without support',
    category: 'physical',
    ageMonthsMin: 5,
    ageMonthsMax: 7,
    description: 'Can sit independently without falling over',
  },
  {
    title: 'Babbles with consonants',
    category: 'language',
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    description: 'Says "ba-ba", "da-da", or similar sounds',
  },
  {
    title: 'Recognizes familiar faces',
    category: 'cognitive',
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    description: 'Shows recognition of familiar people',
  },
  {
    title: 'Responds to own name',
    category: 'language',
    ageMonthsMin: 5,
    ageMonthsMax: 7,
    description: 'Turns when hearing their name',
  },

  // 7-9 Months
  {
    title: 'Crawls',
    category: 'physical',
    ageMonthsMin: 7,
    ageMonthsMax: 10,
    description: 'Moves around by crawling on hands and knees',
  },
  {
    title: 'Plays peek-a-boo',
    category: 'social',
    ageMonthsMin: 7,
    ageMonthsMax: 9,
    description: 'Enjoys and participates in peek-a-boo game',
  },
  {
    title: 'Uses pincer grasp',
    category: 'physical',
    ageMonthsMin: 8,
    ageMonthsMax: 10,
    description: 'Picks up small objects with thumb and finger',
  },
  {
    title: 'Says "mama" or "dada"',
    category: 'language',
    ageMonthsMin: 8,
    ageMonthsMax: 12,
    description: 'Says "mama" or "dada" specifically to parents',
  },

  // 10-12 Months
  {
    title: 'Stands alone',
    category: 'physical',
    ageMonthsMin: 10,
    ageMonthsMax: 14,
    description: 'Stands without support for a few seconds',
  },
  {
    title: 'Takes first steps',
    category: 'physical',
    ageMonthsMin: 10,
    ageMonthsMax: 15,
    description: 'Takes first independent steps',
  },
  {
    title: 'Waves bye-bye',
    category: 'social',
    ageMonthsMin: 9,
    ageMonthsMax: 12,
    description: 'Waves hand to say goodbye',
  },
  {
    title: 'Says first words',
    category: 'language',
    ageMonthsMin: 10,
    ageMonthsMax: 14,
    description: 'Uses one or two words besides "mama" and "dada"',
  },
  {
    title: 'Points at objects',
    category: 'cognitive',
    ageMonthsMin: 10,
    ageMonthsMax: 12,
    description: 'Points to things they want',
  },

  // 13-18 Months
  {
    title: 'Walks independently',
    category: 'physical',
    ageMonthsMin: 12,
    ageMonthsMax: 16,
    description: 'Walks well without help',
  },
  {
    title: 'Drinks from cup',
    category: 'physical',
    ageMonthsMin: 12,
    ageMonthsMax: 18,
    description: 'Can drink from a cup with little spilling',
  },
  {
    title: 'Uses 3-6 words',
    category: 'language',
    ageMonthsMin: 14,
    ageMonthsMax: 18,
    description: 'Has vocabulary of at least 3-6 words',
  },
  {
    title: 'Shows affection',
    category: 'social',
    ageMonthsMin: 13,
    ageMonthsMax: 18,
    description: 'Hugs, kisses, or shows affection to familiar people',
  },
  {
    title: 'Stacks blocks',
    category: 'cognitive',
    ageMonthsMin: 15,
    ageMonthsMax: 18,
    description: 'Can stack 2-3 blocks on top of each other',
  },

  // 19-24 Months
  {
    title: 'Runs',
    category: 'physical',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Runs with coordination',
  },
  {
    title: 'Kicks a ball',
    category: 'physical',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Can kick a ball forward',
  },
  {
    title: 'Uses 2-word phrases',
    category: 'language',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Combines two words like "more milk" or "go bye-bye"',
  },
  {
    title: 'Follows simple instructions',
    category: 'cognitive',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Can follow simple one-step commands',
  },
  {
    title: 'Plays pretend',
    category: 'cognitive',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Engages in simple pretend play',
  },
  {
    title: 'Shows independence',
    category: 'social',
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    description: 'Wants to do things independently',
  },
]

export function getMilestonesByCategory(category: string): MilestoneTemplate[] {
  return COMMON_MILESTONES.filter((m) => m.category === category)
}

export function getMilestonesByAge(ageMonths: number): MilestoneTemplate[] {
  return COMMON_MILESTONES.filter(
    (m) => ageMonths >= m.ageMonthsMin && ageMonths <= m.ageMonthsMax
  )
}

export function getCategoryEmoji(category: string): string {
  const cat = MILESTONE_CATEGORIES.find((c) => c.value === category)
  return cat?.emoji || '🎯'
}

export function getCategoryLabel(category: string): string {
  const cat = MILESTONE_CATEGORIES.find((c) => c.value === category)
  return cat?.label || category
}
