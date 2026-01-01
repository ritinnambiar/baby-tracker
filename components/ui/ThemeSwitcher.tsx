'use client'

import { useTheme } from '@/lib/hooks/useTheme'
import { Card } from './Card'

export function ThemeSwitcher() {
  const { currentTheme, setTheme, allThemes } = useTheme()

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🎨 Theme Selector</h3>
      <p className="text-sm text-gray-600 mb-4">Choose your favorite theme!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allThemes.map((theme) => {
          const isActive = theme.name === currentTheme.name

          return (
            <button
              key={theme.name}
              onClick={() => setTheme(theme.name)}
              className={`relative rounded-2xl p-4 transition-all ${
                isActive
                  ? 'ring-4 ring-offset-2 ring-primary-500 scale-105'
                  : 'hover:scale-102 hover:shadow-md'
              }`}
            >
              {/* Theme preview gradient */}
              <div
                className="absolute inset-0 rounded-2xl opacity-90"
                style={{ background: theme.gradientCSS }}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="font-bold text-gray-800 mb-2">{theme.displayName}</div>

                {/* Color dots preview */}
                <div className="flex gap-2 justify-center">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.colors.bg1 }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.colors.bg2 }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.colors.bg3 }}
                  />
                </div>

                {isActive && (
                  <div className="mt-2 text-sm font-semibold text-gray-700">✓ Active</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
