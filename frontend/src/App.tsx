import { useState } from "react"
import VendorsPage from "./pages/VendorsPage"
import SchoolsPage from "./pages/SchoolsPage"
import ClassesPage from "./pages/ClassesPage"
import SolvePage from "./pages/SolvePage"
import "./App.css"

const TABS = [
  { key: "vendors", label: "Vendors", Page: VendorsPage },
  { key: "schools", label: "Schools", Page: SchoolsPage },
  { key: "classes", label: "Classes", Page: ClassesPage },
  { key: "solve", label: "Solve", Page: SolvePage },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function App() {
  const [tab, setTab] = useState<TabKey>("vendors")
  const ActivePage = TABS.find((t) => t.key === tab)!.Page

  return (
    <main className="page">
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <ActivePage />
    </main>
  )
}
