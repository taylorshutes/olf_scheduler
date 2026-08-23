import { useState } from "react"
import { useTranslation } from "react-i18next"
import TextField from "@mui/material/TextField"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import type { School, SchoolClass, Vendor } from "../../../../api/client"

export type EntityType = "vendor" | "school" | "class"

interface SearchProps {
  vendors: Vendor[]
  schools: School[]
  classes: SchoolClass[]
  onSelect: (type: EntityType, id: number) => void
}

interface SearchResult {
  key: string
  type: string
  name: string
  onClick: () => void
}

// Live client-side filter across already-fetched vendors/schools/classes.
const Search = ({ vendors, schools, classes, onSelect }: SearchProps) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()

  const results: SearchResult[] =
    q === ""
      ? []
      : [
          ...vendors
            .filter((v) => v.name.toLowerCase().includes(q))
            .map((v) => ({
              key: `vendor-${v.id}`,
              type: t("home.sideNav.searchVendorLabel"),
              name: v.name,
              onClick: () => onSelect("vendor", v.id),
            })),
          ...schools
            .filter((s) => s.name.toLowerCase().includes(q))
            .map((s) => ({
              key: `school-${s.id}`,
              type: t("home.sideNav.searchSchoolLabel"),
              name: s.name,
              onClick: () => onSelect("school", s.id),
            })),
          ...classes
            .filter((c) => c.name.toLowerCase().includes(q))
            .map((c) => ({
              key: `class-${c.id}`,
              type: t("home.sideNav.searchClassLabel"),
              name: c.name,
              onClick: () => onSelect("class", c.id),
            })),
        ]

  return (
    <div>
      <TextField
        fullWidth
        size="small"
        placeholder={t("home.sideNav.searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {q !== "" && (
        <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
          {results.length === 0 ? (
            <ListItem>
              <Typography variant="body2" color="text.secondary">
                {t("home.sideNav.searchNoResults")}
              </Typography>
            </ListItem>
          ) : (
            results.map((r) => (
              <ListItemButton key={r.key} onClick={r.onClick}>
                <ListItemText primary={`${r.type}: ${r.name}`} />
              </ListItemButton>
            ))
          )}
        </List>
      )}
    </div>
  )
}

export default Search
