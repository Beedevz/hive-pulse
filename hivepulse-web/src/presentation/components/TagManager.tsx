import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useTags, useCreateTag, useDeleteTag } from '../../application/useTags'

const PRESET_COLORS = ['#F5A623', '#4ADE80', '#6BA3F7', '#F87171', '#FBBF24', '#A78BFA', '#34D399', '#FB923C']

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
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField value={name} onChange={(e) => setName(e.target.value)} size="small" placeholder="Tag name" sx={{ flex: 1 }} />
        <Box>
          <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.75 }}>Color</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setColor(c)}
                sx={{
                  width: 24, height: 24, borderRadius: '50%', bgcolor: c,
                  cursor: 'pointer',
                  border: color === c ? '2px solid white' : '2px solid transparent',
                  outline: color === c ? `2px solid ${c}` : 'none',
                  boxSizing: 'border-box',
                  transition: 'transform 0.1s',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
            <Box
              component="label"
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
              title="Custom color"
            >
              <Box
                component="input"
                type="color"
                value={color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                sx={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: 'none', padding: 0, cursor: 'pointer',
                  bgcolor: 'transparent',
                  '&::-webkit-color-swatch-wrapper': { padding: 0 },
                  '&::-webkit-color-swatch': { borderRadius: '50%', border: '2px solid', borderColor: 'divider' },
                }}
              />
            </Box>
          </Box>
        </Box>
        <Button variant="outlined" size="small" onClick={handleCreate} disabled={!name.trim()}>Add</Button>
      </Box>
    </Box>
  )
}
