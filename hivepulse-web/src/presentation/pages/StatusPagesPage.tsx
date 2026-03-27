import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useStatusPages } from '../../application/useStatusPages'
import { StatusPageCard } from '../components/StatusPageCard'
import { StatusPageModal } from '../components/StatusPageModal'
import type { StatusPage } from '../../domain/statusPage'

export function StatusPagesPage() {
  const { data, isPending } = useStatusPages()
  const pages = data?.data ?? []
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StatusPage | undefined>()

  const openCreate = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (sp: StatusPage) => { setEditing(sp); setModalOpen(true) }
  const closeModal = () => { setEditing(undefined); setModalOpen(false) }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={700} >
          Status Pages
        </Typography>
        <Button variant="contained" size="small" onClick={openCreate} sx={{ fontWeight: 700 }}>
          + New Page
        </Button>
      </Box>

      {isPending && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}
      {!isPending && pages.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ pt: 4 }}>
          No status pages yet. Create one to get started.
        </Typography>
      )}
      {!isPending && pages.length > 0 && pages.map((sp) => <StatusPageCard key={sp.id} statusPage={sp} onEdit={openEdit} />)}

      <StatusPageModal
        key={editing?.id ?? `new-${modalOpen}`}
        open={modalOpen}
        onClose={closeModal}
        existing={editing}
      />
    </Box>
  )
}
