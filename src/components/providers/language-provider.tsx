"use client"

import { LanguageProvider as LP } from "@/i18n/context"
import type { ReactNode } from "react"

export default function LanguageProvider({ children }: { children: ReactNode }) {
  return <LP>{children}</LP>
}
