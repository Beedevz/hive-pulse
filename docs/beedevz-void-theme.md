# Beedevz Void Theme — Color Scale

Beedevz design system'in HivePulse'a entegre edilmis Void Dark temasinin tam renk skalasi.

Typography: **Outfit** (headings) + **JetBrains Mono** (body/data)

---

## Surfaces

| Token | Hex / Value | Kullanim |
|-------|-------------|----------|
| Background | `#0A0A0F` | Ana sayfa arkaplani |
| Paper | `#16161F` | Kart, dialog, panel yüzeyleri |
| Sidebar | `#111118` | Sol panel / sidebar |
| Header | `#111118` | Üst header bar |
| Input | `#1C1C28` | Form alanlari, input arkaplani |
| Surface 2 | `#1C1C28` | Alternatif yüzey (hover vb.) |

## Borders

| Token | Value | Kullanim |
|-------|-------|----------|
| Border | `rgba(255,255,255,0.06)` | Varsayilan border |
| Border Hover | `rgba(240,165,0,0.25)` | Hover / focus border |

## Accent (Amber/Gold)

| Token | Hex | Kullanim |
|-------|-----|----------|
| Accent | `#F0A500` | Primary buton, aktif state, vurgu |
| Accent Light | `#FFC233` | Hover state, light varyant |
| Accent Dim | `#A07000` | Subtle / secondary vurgu |
| Accent Glow | `rgba(240,165,0,0.15)` | Glow efekti, subtle arkaplan |
| Accent Bg | `rgba(240,165,0,0.08)` | Badge / chip arkaplani |
| Accent Border | `rgba(240,165,0,0.20)` | Accent border, aktif kart kenari |

## Text

| Token | Hex | Kullanim |
|-------|-----|----------|
| Primary | `#E8E6E1` | Ana metin |
| Secondary | `#8A8690` | Ikincil metin, label'lar |
| Tertiary | `#5A5660` | Placeholder, devre disi metin |

## Status Colors

| Durum | Hex | Kullanim |
|-------|-----|----------|
| Up / Operational | `#34D399` | Calisan monitor, basari |
| Down / Alert | `#F87171` | Düsen monitor, hata |
| Degraded / Warning | `#FBBF24` | Yavas / performans uyarisi |
| Maintenance / Info | `#6BA3F7` | Bakim modu, bilgilendirme |

## MUI Palette Mapping

```
palette.mode         = 'dark'
palette.primary.main = #F0A500
palette.primary.dark = #A07000
palette.primary.light= #FFC233
palette.error.main   = #F87171
palette.success.main = #34D399
palette.warning.main = #FBBF24
palette.info.main    = #6BA3F7
palette.background.default = #0A0A0F
palette.background.paper   = #16161F
palette.text.primary   = #E8E6E1
palette.text.secondary = #8A8690
palette.divider        = rgba(255,255,255,0.06)
```

## Theme Tokens (theme.ts)

```
bg:           #0A0A0F
surface:      #16161F
text:         #E8E6E1
text2:        #8A8690
text3:        #5A5660
accent:       #F0A500
accentLight:  #FFC233
accentBg:     rgba(240,165,0,0.08)
accentBorder: rgba(240,165,0,0.20)
border:       rgba(255,255,255,0.06)
up:           #34D399
down:         #F87171
degraded:     #FBBF24
maintenance:  #6BA3F7
input:        #1C1C28
shadow:       0 2px 24px rgba(0,0,0,0.60)
```

## Component Overrides

| Component | Ozellik | Deger |
|-----------|---------|-------|
| Paper | boxShadow | `0 2px 24px rgba(0,0,0,0.60)` |
| Paper | backgroundImage | `none` |
| Dialog | backgroundColor | `#16161F` |
| Dialog | border | `1px solid rgba(240,165,0,0.25)` |
| Input | backgroundColor | `#1C1C28` |
| Input focus | borderColor | `#F0A500` |
| Table head | color | `#5A5660` |
| Shape | borderRadius | `8px` |
