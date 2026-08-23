import type { Vendor } from "../../api/client"

// Same hex values as grid.py's PALETTE (backend only sends resolved
// per-class colors, not this raw list, so it's duplicated here).
const PALETTE = [
  "#F28C8C", "#F2C68C", "#F2EA8C", "#B7E28C", "#8CE2B0",
  "#8CDDE2", "#8CB0E2", "#A98CE2", "#E28CDD", "#E28CA9",
  "#D9A066", "#8CE2C6", "#C6E28C", "#8C9EE2", "#E2C68C",
  "#B98CE2", "#8CE28C", "#E28C8C", "#8CC6E2", "#E2A98C",
]

export const BREAK_COLOR = "#e0e0e0"

// One stable color per vendor name, so "Robotics Lab" looks the same
// wherever it shows up on the same page (e.g. several classes' schedules
// listed together on a school's detail view).
export const assignWorkshopColors = (vendors: Vendor[]): Record<string, string> => {
  const colors: Record<string, string> = {}
  vendors.forEach((v, i) => {
    colors[v.name] = PALETTE[i % PALETTE.length]
  })
  return colors
}
