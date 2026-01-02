'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'

export type ThemeName =
  | 'pastel-classic'
  | 'candy-ice-cream'
  | 'rainbow-nursery'
  | 'ocean-baby'
  | 'woodland-forest'
  | 'dreamy-clouds'
  | 'bubblegum-pop'

export interface Theme {
  name: ThemeName
  displayName: string
  colors: {
    bg1: string
    bg2: string
    bg3: string
    primary: string
    accent: string
    text: string
  }
  gradient: string
  gradientCSS: string // CSS gradient for inline styles
}

export const themes: Record<ThemeName, Theme> = {
  'pastel-classic': {
    name: 'pastel-classic',
    displayName: 'Pastel Classic',
    colors: {
      bg1: '#FFE4E9', // baby-pink
      bg2: '#E4F1FF', // baby-blue
      bg3: '#FFF9E4', // baby-yellow
      primary: '#FF6B8A',
      accent: '#0074FF',
      text: '#1F2937',
    },
    gradient: 'from-[#FFE4E9] via-[#E4F1FF] to-[#FFF9E4]',
    gradientCSS: '#1a1a1a',
  },
  'candy-ice-cream': {
    name: 'candy-ice-cream',
    displayName: 'Candy & Ice Cream',
    colors: {
      bg1: '#B8E6D5', // mint
      bg2: '#E6D5F5', // lavender
      bg3: '#FFB5A7', // coral
      primary: '#FF8BA3',
      accent: '#9B7EDE',
      text: '#2D3748',
    },
    gradient: 'from-[#B8E6D5] via-[#E6D5F5] to-[#FFB5A7]',
    gradientCSS: '#1e1e1e',
  },
  'rainbow-nursery': {
    name: 'rainbow-nursery',
    displayName: 'Rainbow Nursery',
    colors: {
      bg1: '#F5D5CF', // muted coral/peach
      bg2: '#FFF4D1', // muted cream/yellow
      bg3: '#D5EDE9', // muted aqua/mint
      primary: '#F5B8C5',
      accent: '#A8D8E8',
      text: '#1F2937',
    },
    gradient: 'from-[#F5D5CF] via-[#FFF4D1] to-[#D5EDE9]',
    gradientCSS: '#1f2937',
  },
  'ocean-baby': {
    name: 'ocean-baby',
    displayName: 'Ocean Baby',
    colors: {
      bg1: '#A8E6E3', // aqua
      bg2: '#FFB5A7', // coral
      bg3: '#F5E6D3', // sand
      primary: '#5DADE2',
      accent: '#FF8A80',
      text: '#2C3E50',
    },
    gradient: 'from-[#A8E6E3] via-[#FFB5A7] to-[#F5E6D3]',
    gradientCSS: '#0f172a',
  },
  'woodland-forest': {
    name: 'woodland-forest',
    displayName: 'Woodland Forest',
    colors: {
      bg1: '#C8D5B9', // sage
      bg2: '#FAF3E0', // cream
      bg3: '#E8B4A0', // terracotta
      primary: '#8B9A7E',
      accent: '#D4A574',
      text: '#3E4A3D',
    },
    gradient: 'from-[#C8D5B9] via-[#FAF3E0] to-[#E8B4A0]',
    gradientCSS: '#18181b',
  },
  'dreamy-clouds': {
    name: 'dreamy-clouds',
    displayName: 'Dreamy Clouds',
    colors: {
      bg1: '#BFDBF7', // sky
      bg2: '#F8F9FA', // cloud
      bg3: '#FFE89C', // sunshine
      primary: '#7CB9E8',
      accent: '#FFD966',
      text: '#4A5568',
    },
    gradient: 'from-[#BFDBF7] via-[#F8F9FA] to-[#FFE89C]',
    gradientCSS: '#111827',
  },
  'bubblegum-pop': {
    name: 'bubblegum-pop',
    displayName: 'Bubblegum Pop',
    colors: {
      bg1: '#FFB6D9', // bubblegum
      bg2: '#D4B5F0', // grape
      bg3: '#FFD19C', // tangerine
      primary: '#FF85C0',
      accent: '#B794F6',
      text: '#2D3748',
    },
    gradient: 'from-[#FFB6D9] via-[#D4B5F0] to-[#FFD19C]',
    gradientCSS: '#171717',
  },
}

interface ThemeContextType {
  currentTheme: Theme
  setTheme: (themeName: ThemeName) => void
  allThemes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName>('rainbow-nursery')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('baby-tracker-theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setCurrentThemeName(savedTheme)
    }
  }, [])

  const setTheme = (themeName: ThemeName) => {
    setCurrentThemeName(themeName)
    localStorage.setItem('baby-tracker-theme', themeName)
  }

  const value: ThemeContextType = useMemo(() => ({
    currentTheme: themes[currentThemeName],
    setTheme,
    allThemes: Object.values(themes),
  }), [currentThemeName])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
