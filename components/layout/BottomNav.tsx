'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Baby, Moon, Target, Ruler } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard',
    },
    {
      name: 'Feeding',
      href: '/feeding',
      icon: Baby,
      active: pathname === '/feeding',
    },
    {
      name: 'Sleep',
      href: '/sleep',
      icon: Moon,
      active: pathname === '/sleep',
    },
    {
      name: 'Diaper',
      href: '/diaper',
      icon: Target,
      active: pathname === '/diaper',
    },
    {
      name: 'Growth',
      href: '/growth',
      icon: Ruler,
      active: pathname === '/growth',
    },
  ]

  // Don't show on auth pages or settings
  if (pathname?.startsWith('/login') ||
      pathname?.startsWith('/signup') ||
      pathname?.startsWith('/settings') ||
      pathname?.startsWith('/accept-invite')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-3 px-2 rounded-2xl transition-all min-h-[64px] ${
                item.active
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:text-primary-500 hover:bg-gray-50'
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${item.active ? 'stroke-[2.5]' : 'stroke-2'}`}
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${item.active ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
