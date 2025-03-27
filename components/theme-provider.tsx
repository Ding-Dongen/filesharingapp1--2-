"use client"

import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// Add the missing createTheme function
export function createTheme(theme: { light: string; dark: string }) {
  return {
    light: theme.light,
    dark: theme.dark,
  }
}

