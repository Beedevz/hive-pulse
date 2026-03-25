import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useTags, useCreateTag, useDeleteTag } from '../../application/useTags'

export function TagManager() {
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6BA3F7')

  const handleCreate = () => {
    if (!name.trim()) return
    createTag.mutate({ name: name.trim(), color }, { onSuccess: () => setName('') })
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2, mb: 3 }}>
      <Typography fontSize="0.75rem" fontWeight={700} letterSpacing={1} color="text.disabled" sx={{ mb: 1.5 }}>TAG MANAGER</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        {tags.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            size="small"
            onDelete={() => deleteTag.mutate(t.id)}
            sx={{ bgcolor: `${t.color}22`, color: t.color }}
          />
        ))}
        {tags.length === 0 && <Typography fontSize="0.8125rem" color="text.secondary">No tags yet.</Typography>}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField value={name} onChange={(e) => setName(e.target.value)} size="small" placeholder="Tag name" sx={{ flex: 1 }} />
        <TextField value={color} onChange={(e) => setColor(e.target.value)} size="small" sx={{ width: 90 }} inputProps={{ style: { fontFamily: 'monospace' } }} />
        <Button variant="outlined" size="small" onClick={handleCreate} disabled={!name.trim()}>Add</Button>
      </Box>
    </Box>
  )
}
