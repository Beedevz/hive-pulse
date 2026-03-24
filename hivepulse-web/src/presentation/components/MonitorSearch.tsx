import { useEffect, useState } from 'react'

interface MonitorSearchProps {
  onSearch: (term: string) => void
}

export function MonitorSearch({ onSearch }: MonitorSearchProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(t)
  }, [value, onSearch])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search monitors…"
      className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />
  )
}
