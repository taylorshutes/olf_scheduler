import { useTranslation } from "react-i18next"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import IconButton from "@mui/material/IconButton"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"

export interface EntityTableColumn<T> {
  header: string
  render: (row: T) => React.ReactNode
}

interface EntityTableProps<T> {
  columns: EntityTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => React.Key
  onEdit: (row: T) => void
  onDelete: (row: T) => void
}

const EntityTable = <T,>({ columns, rows, getRowKey, onEdit, onDelete }: EntityTableProps<T>) => {
  const { t } = useTranslation()
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.header}>{col.header}</TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.header}>{col.render(row)}</TableCell>
              ))}
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(row)} aria-label={t("common.edit")}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(row)} aria-label={t("common.delete")}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default EntityTable
