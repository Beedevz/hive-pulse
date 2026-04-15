import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import { useDeleteStatusPage } from '../../application/useStatusPages'
import { useTags } from '../../application/useTags'
import type { StatusPage } from '../../domain/statusPage'

interface Props {
  statusPage: StatusPage
  onEdit: (sp: StatusPage) => void
}

const BASE_URL = globalThis.window === undefined ? '' : globalThis.window.location.origin

export function StatusPageCard({ statusPage, onEdit }: Readonly<Props>) {
  const del = useDeleteStatusPage()
  const { data: allTags = [] } = useTags()
  const assignedTags = allTags.filter((t) => statusPage.tag_ids.includes(t.id))

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2, mb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusPage.accent_color, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={600} noWrap>{statusPage.title}</Typography>
        <Typography fontSize="0.75rem" color="text.secondary" >
          /s/{statusPage.slug}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
          {assignedTags.map((t) => (
            <Chip key={t.id} label={t.name} size="small" sx={{ bgcolor: `${t.color}22`, color: t.color, fontSize: '0.625rem' }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Button size="small" href={`${BASE_URL}/s/${statusPage.slug}`} target="_blank" rel="noreferrer">View</Button>
        <Button size="small" onClick={() => onEdit(statusPage)}>Edit</Button>
        <Button size="small" color="error" onClick={() => del.mutate(statusPage.id)}>Delete</Button>
      </Box>
    </Box>
  )
}
