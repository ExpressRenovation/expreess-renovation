"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

/**
 * Light/dark toggle for the single brand theme.
 *
 * The site used to offer Blue/Green/Orange colour schemes, but only `luxury`
 * and `blue` were ever defined in globals.css — picking Green or Orange left
 * every token undefined and broke the page. Now there is one palette, in two
 * modes.
 */
export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // The server has no way to know the stored theme, so render a stable icon
    // until hydration to avoid a mismatch.
    React.useEffect(() => setMounted(true), [])

    // Before mount the stored theme is unknown, so every theme-dependent output
    // — icon *and* label — must match what the server rendered, or React
    // reports a hydration mismatch and rebuilds the tree on the client.
    const isDark = mounted && theme === 'dark-theme-luxury'
    const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro'

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() => setTheme(isDark ? 'theme-luxury' : 'dark-theme-luxury')}
        >
            {isDark ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">{label}</span>
        </Button>
    )
}
