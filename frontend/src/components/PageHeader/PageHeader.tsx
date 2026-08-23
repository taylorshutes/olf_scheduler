import Typography from "@mui/material/Typography"

const PageHeader = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="h4" component="h1" gutterBottom>
    {children}
  </Typography>
)

export default PageHeader
