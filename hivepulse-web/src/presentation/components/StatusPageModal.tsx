import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useTags } from '../../application/useTags'
import { useCreateStatusPage, useUpdateStatusPage } from '../../application/useStatusPages'
import type { StatusPage, CreateStatusPageInput } from '../../domain/statusPage'

const BASE_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

interface Props {
  open: boolean
  onClose: () => void
  existing?: StatusPage
}

const PRESET_COLORS = ['#F5A623', '#4ADE80', '#6BA3F7', '#F87171', '#FBBF24', '#A78BFA']

export function StatusPageModal({ open, onClose, existing }: Readonly<Props>) {
  const { data: tags = [] } = useTags()
  const create = useCreateStatusPage()
  const update = useUpdateStatusPage()

  const [title, setTitle] = useState(existing?.title ?? '')
  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!existing)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? '')
  const [accentColor, setAccentColor] = useState(existing?.accent_color ?? '#F5A623')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(existing?.tag_ids ?? [])

  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(`${slugify(title)}-${randomSuffix()}`)
    }
  }, [title, slugEdited])

  const handleSubmit = () => {
    const input: CreateStatusPageInput = {
      title, slug, description, logo_url: logoUrl || undefined,
      accent_color: accentColor, tag_ids: selectedTagIds,
    }
    if (existing) {
      update.mutate({ id: existing.id, ...input }, { onSuccess: onClose })
    } else {
      create.mutate(input, { onSuccess: onClose })
    }
  }

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{existing ? 'Edit Status Page' : 'New Status Page'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth size="small" inputProps={{ 'aria-label': 'title' }} />
        <Box>
          <TextField
            label="Slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
            fullWidth size="small"
            inputProps={{ 'aria-label': 'slug' }}
            helperText={<a href={`${BASE_URL}/s/${slug}`} target="_blank" rel="noreferrer">Preview</a>}
          />
        </Box>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth size="small" multiline rows={2} />
        <TextField label="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} fullWidth size="small" placeholder="https://..." />
        <Box>
          <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.75 }}>Accent Color</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setAccentColor(c)}
                sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: accentColor === c ? '2px solid white' : '2px solid transparent', boxSizing: 'border-box' }}
              />
            ))}
            <TextField
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ style: { fontFamily: 'monospace' } }}
            />
          </Box>
        </Box>
        {tags.length > 0 && (
          <Box>
            <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.75 }}>Monitor Tags</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {tags.map((t) => (
                <Chip
                  key={t.id}
                  label={t.name}
                  size="small"
                  onClick={() => toggleTag(t.id)}
                  variant={selectedTagIds.includes(t.id) ? 'filled' : 'outlined'}
                  sx={{ borderColor: t.color, color: selectedTagIds.includes(t.id) ? '#fff' : t.color, bgcolor: selectedTagIds.includes(t.id) ? t.color : 'transparent' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!title || create.isPending || update.isPending}>
          {existing ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
