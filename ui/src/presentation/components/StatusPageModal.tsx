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

const BASE_URL = globalThis.window === undefined ? '' : globalThis.window.location.origin

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

const PRESET_COLORS = ['#F5A623', '#4ADE80', '#6BA3F7', '#F87171', '#FBBF24', '#A78BFA', '#34D399', '#FB923C']

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth size="small" slotProps={{ htmlInput: { 'aria-label': 'title' } }} />
        <Box>
          <TextField
            label="Slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
            fullWidth size="small"
            slotProps={{ htmlInput: { 'aria-label': 'slug' } }}
          />
          <Typography fontSize="0.75rem" sx={{ mt: 0.5 }}>
            <a href={`${BASE_URL}/s/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">Preview</a>
          </Typography>
        </Box>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth size="small" multiline rows={2} />
        <TextField label="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} fullWidth size="small" placeholder="https://..." />
        <Box>
          <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.75 }}>Accent Color</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setAccentColor(c)}
                sx={{
                  width: 28, height: 28, borderRadius: '50%', bgcolor: c,
                  cursor: 'pointer',
                  border: accentColor === c ? '2px solid white' : '2px solid transparent',
                  outline: accentColor === c ? `2px solid ${c}` : 'none',
                  boxSizing: 'border-box',
                  transition: 'transform 0.1s',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
            <Box
              component="label"
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Custom color"
            >
              <Box
                component="input"
                type="color"
                value={accentColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccentColor(e.target.value)}
                sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: 'none', padding: 0, cursor: 'pointer',
                  bgcolor: 'transparent',
                  '&::-webkit-color-swatch-wrapper': { padding: 0 },
                  '&::-webkit-color-swatch': { borderRadius: '50%', border: '2px solid', borderColor: 'divider' },
                }}
              />
            </Box>
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
