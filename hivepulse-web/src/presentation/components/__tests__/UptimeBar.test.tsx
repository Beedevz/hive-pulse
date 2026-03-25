import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UptimeBar } from '../UptimeBar'
import type { BlockStatus } from '../UptimeBar'

describe('UptimeBar', () => {
  it('renders exactly 48 blocks', () => {
    const blocks = Array(48).fill('unknown') as BlockStatus[]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.children).toHaveLength(48)
  })

  it('applies green color for up blocks', () => {
    const blocks = Array(48).fill('up') as BlockStatus[]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const firstBlock = container.firstChild!.firstChild as HTMLElement
    expect(firstBlock.style.backgroundColor).toBe('rgb(34, 197, 94)')
  })

  it('applies red color for down blocks', () => {
    const blocks: BlockStatus[] = ['down', ...Array(47).fill('unknown') as BlockStatus[]]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const firstBlock = container.firstChild!.firstChild as HTMLElement
    expect(firstBlock.style.backgroundColor).toBe('rgb(239, 68, 68)')
  })
})
