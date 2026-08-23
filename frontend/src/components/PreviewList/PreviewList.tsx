import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Button from "@mui/material/Button"

interface PreviewListProps<T> {
  title: string
  items: T[]
  getKey: (item: T) => React.Key
  renderItem: (item: T) => React.ReactNode
  addLabel: string
  onAdd: () => void
  onSelectItem?: (item: T) => void
  maxHeight?: number
}

// A scrollable preview of a list, with a button to go add more. Used in the
// home page's side nav for vendors/classes — all items are already loaded
// (via the existing hooks), so "scrollable" here just means a fixed-height
// box with overflow, not paginated fetching from the server. Pass
// onSelectItem to make each row clickable (e.g. jump to its detail view).
const PreviewList = <T,>({
  title,
  items,
  getKey,
  renderItem,
  addLabel,
  onAdd,
  onSelectItem,
  maxHeight = 240,
}: PreviewListProps<T>) => (
  <Box>
    <Typography variant="subtitle2" gutterBottom>
      {title}
    </Typography>
    <List
      dense
      sx={{ maxHeight, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1 }}
    >
      {items.map((item) =>
        onSelectItem ? (
          <ListItemButton key={getKey(item)} onClick={() => onSelectItem(item)}>
            <ListItemText primary={renderItem(item)} />
          </ListItemButton>
        ) : (
          <ListItem key={getKey(item)}>
            <ListItemText primary={renderItem(item)} />
          </ListItem>
        ),
      )}
    </List>
    <Button size="small" variant="outlined" fullWidth onClick={onAdd}>
      {addLabel}
    </Button>
  </Box>
)

export default PreviewList
