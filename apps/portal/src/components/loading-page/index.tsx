import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const LoadingPage = ({ minHeight }: any) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minHeight || '480px',
      }}
    >
      <CircularProgress size={200} />
      <Typography
        variant="caption"
        sx={{ mt: 4 }}
      >
        Loading
      </Typography>
    </Box>
  )
}
