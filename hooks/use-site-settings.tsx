'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSiteSettings } from '@/lib/actions/products'

const defaults: Record<string, string> = {
  restaurant_name: "Pee's Bakery & Restaurant",
  phone: '+232 78 891638',
  whatsapp: '+232 78 891638',
  checkout_whatsapp: '+232 33 680260',
  order_phone: '+232 75 361494',
  address: '90A Regent Road, Old School Junction, Freetown, Sierra Leone',
  opening_hours: 'Contact us for today’s hours',
  currency: 'Le',
}

const SiteSettingsContext = createContext<Record<string, string>>(defaults)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaults)
  useEffect(() => {
    let active = true
    getSiteSettings().then(result => {
      if (!active || !result.success) return
      const loaded = Object.fromEntries(result.data.map(item => [item.key, item.value || '']))
      setSettings({ ...defaults, ...loaded })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
