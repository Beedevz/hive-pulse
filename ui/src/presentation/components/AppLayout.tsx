import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import { TopNav } from './TopNav'
import { HoneycombBg } from './HoneycombBg'

export function AppLayout() {
  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
      <HoneycombBg opacity={0.025} />
      <TopNav />
      <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
