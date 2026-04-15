import { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

interface MonitorSearchProps {
  onSearch: (term: string) => void
}

export function MonitorSearch({ onSearch }: Readonly<MonitorSearchProps>) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(t)
  }, [value, onSearch])

  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search monitors…"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
