import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"

// Holds the top-level tab bar. A search box can slot in here later once
// there's something to search into (e.g. jumping to a specific class) —
// not built yet, see the feature backlog.
export interface NavTabItem {
  key: string
  label: string
}

interface NavTabsProps {
  tabs: NavTabItem[]
  active: string
  onChange: (key: string) => void
}

const NavTabs = ({ tabs, active, onChange }: NavTabsProps) => (
  <Tabs value={active} onChange={(_, value) => onChange(value)} sx={{ mb: 3 }}>
    {tabs.map((tab) => (
      <Tab key={tab.key} value={tab.key} label={tab.label} />
    ))}
  </Tabs>
)

export default NavTabs
