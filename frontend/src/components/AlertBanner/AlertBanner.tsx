import Alert from "@mui/material/Alert"

const AlertBanner = ({ message }: { message: string | null }) => {
  if (!message) return null
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  )
}

export default AlertBanner
