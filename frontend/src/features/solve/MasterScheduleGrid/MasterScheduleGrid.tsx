import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import type { SolveResult } from "../../../api/client"

interface MasterScheduleGridProps {
  result: SolveResult
  classLabel: (classId: string) => string
}

const MasterScheduleGrid = ({ result, classLabel }: MasterScheduleGridProps) => {
  const { t } = useTranslation()

  if (!result.grid) return null

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("solve.masterScheduleTitle")}
      </Typography>

      {result.colors && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          {Object.keys(result.schedule).map((classId) => (
            <Box key={classId} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  border: "1px solid rgba(0,0,0,0.2)",
                  background: result.colors![classId] ?? "#dddddd",
                }}
              />
              <Typography variant="body2">{classLabel(classId)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Scrolls both ways: TableContainer scrolls horizontally by default
          for wide content, and maxHeight here adds vertical scroll too. */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t("solve.timeColumn")}</TableCell>
              {result.grid.vendor_names.map((name) => (
                <TableCell key={name}>{name}</TableCell>
              ))}
              <TableCell>{t("solve.breakColumn")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.grid.times.map((time) => (
              <TableRow key={time}>
                <TableCell>{time}</TableCell>
                {result.grid!.vendor_names.map((name) => {
                  const entries = result.grid!.cell_text[time][name]
                  const color = entries.length > 0 ? result.colors?.[entries[0].class_id] : undefined
                  return (
                    <TableCell key={name} sx={color ? { backgroundColor: color } : undefined}>
                      {entries.map((e) => e.text).join(" / ")}
                    </TableCell>
                  )
                })}
                <TableCell sx={{ backgroundColor: "action.hover" }}>
                  {result.grid!.break_text[time].map((e) => e.text).join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default MasterScheduleGrid
