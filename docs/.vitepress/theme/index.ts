// oxlint-disable import/no-unassigned-import
import type { Theme } from "vitepress"

import DefaultTheme from "vitepress/theme-without-fonts"
// @ts-ignore -- Virtual stylesheet supplied by the group-icons Vite plugin.
import "virtual:group-icons.css"
import "./fonts.css"
import "./custom.css"

const theme: Theme = { extends: DefaultTheme }

export default theme
