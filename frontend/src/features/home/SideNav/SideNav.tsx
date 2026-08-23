import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import { PreviewList } from "../../../components"
import Search, { type EntityType } from "./Search"
import type { School, SchoolClass, Vendor } from "../../../api/client"

interface SideNavProps {
  vendors: Vendor[]
  schools: School[]
  classes: SchoolClass[]
  onNavigate: (tab: string) => void
  onSelect: (type: EntityType, id: number) => void
}

const SideNav = ({ vendors, schools, classes, onNavigate, onSelect }: SideNavProps) => {
  const { t } = useTranslation()

  return (
    <Box sx={{ width: 280, flexShrink: 0 }}>
      <Stack spacing={3}>
        <Search vendors={vendors} schools={schools} classes={classes} onSelect={onSelect} />
        <PreviewList
          title={t("home.sideNav.vendorsTitle")}
          items={vendors}
          getKey={(v) => v.id}
          renderItem={(v) => v.name}
          addLabel={t("home.sideNav.addVendor")}
          onAdd={() => onNavigate("vendors")}
          onSelectItem={(v) => onSelect("vendor", v.id)}
        />
        <PreviewList
          title={t("home.sideNav.classesTitle")}
          items={classes}
          getKey={(c) => c.id}
          renderItem={(c) => c.name}
          addLabel={t("home.sideNav.addClass")}
          onAdd={() => onNavigate("classes")}
          onSelectItem={(c) => onSelect("class", c.id)}
        />
      </Stack>
    </Box>
  )
}

export default SideNav
