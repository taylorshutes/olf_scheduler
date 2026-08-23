import Box from "@mui/material/Box"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Chip from "@mui/material/Chip"
import { BREAK_COLOR } from "../workshopColors"
import type { ScheduleEntry } from "../../../api/client"

interface ClassScheduleListProps {
  entries: ScheduleEntry[]
  workshopColors: Record<string, string>
}

// A single class's day as a plain list — shared by SolvePage (one per class,
// under a heading), ClassDetailPage, and SchoolDetailPage (one per class at
// that school). Matches VendorDetailPage's timetable style: time + a small
// colored chip, not a full-row color block. Each workshop gets its own
// color (from workshopColors, keyed by vendor name); recess/lunch are a
// plain light grey chip either way.
const ClassScheduleList = ({ entries, workshopColors }: ClassScheduleListProps) => (
  <List dense>
    {entries.map((e, i) => (
      <ListItem key={i}>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>
                {e.start}–{e.end}
              </span>
              <Chip
                size="small"
                label={e.label}
                sx={{ backgroundColor: e.kind === "workshop" ? (workshopColors[e.label] ?? "#dddddd") : BREAK_COLOR }}
              />
            </Box>
          }
        />
      </ListItem>
    ))}
  </List>
)

export default ClassScheduleList
