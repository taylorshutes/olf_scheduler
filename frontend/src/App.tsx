import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Container from "@mui/material/Container"
import { theme } from "./theme/theme"
import { useSolve } from "./hooks/useSolve"
import NavTabs, { type NavTabItem } from "./features/navigation"
import HomePage from "./features/home"
import VendorsPage from "./features/vendors"
import SchoolsPage from "./features/schools"
import ClassesPage from "./features/classes"
import SolvePage from "./features/solve"

const App = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState("home")
  // Lifted up here so Home and Solve show the same result instead of each
  // running its own independent solve.
  const solve = useSolve()

  const TABS: NavTabItem[] = [
    { key: "home", label: t("nav.home") },
    { key: "vendors", label: t("nav.vendors") },
    { key: "schools", label: t("nav.schools") },
    { key: "classes", label: t("nav.classes") },
    { key: "solve", label: t("nav.solve") },
  ]

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <NavTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "home" && <HomePage solve={solve} onNavigate={setTab} />}
        {tab === "vendors" && <VendorsPage solve={solve} />}
        {tab === "schools" && <SchoolsPage solve={solve} />}
        {tab === "classes" && <ClassesPage solve={solve} />}
        {tab === "solve" && <SolvePage solve={solve} />}
      </Container>
    </ThemeProvider>
  )
}

export default App
