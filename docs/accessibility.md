# Accessibility

## Colour contrast

The Figma reference palette was sampled pixel-for-pixel from `/reference`, and
most of its **text** pairings fall below the WCAG 2.1 AA minimum of 4.5:1.

To keep the UI looking exactly as drawn while making the copy readable, every
status colour is split into two tokens:

| token | role | value |
|---|---|---|
| `--color-X` | **text** — labels, values, links | darkened until it clears 4.5:1 |
| `--color-X-fill` | **fills** — chip backgrounds, dots, avatar tints, borders, solid buttons | the exact Figma value |

So a status chip still paints `bg-success-fill/12` (the original `#00C87A` at
12%) while its label uses `text-success` (`#007F4D`). Nothing about the shape,
tint or weight of the UI changed — only the ink.

### Values

| token | Figma | AA text value | worst real ratio |
|---|---|---|---|
| muted | `#9097B8` | `#656F9D` | 4.50 |
| neutral | `#9097B8` | `#646E9C` | 4.53 |
| success | `#00C87A` | `#007F4D` | 4.55 |
| warning | `#FFBE0B` | `#936C00` | 4.51 |
| danger | `#FF7456` | `#D52600` | 4.55 |
| primary (text only) | `#7C6FF7` | `#5D4DF5` | 4.53 |
| sidebar item | `#5B638C` | `#9197B7` | 4.50 |
| sidebar group label | `#3D4466` | `#7F87B2` | 4.50 |

"Worst real ratio" is measured against every surface the token actually appears
on — white, the `#F7F8FC` canvas, and its own tint — not just white. The canvas
and the tints are usually the binding constraint, which is why the values are
darker than a naive white-only calculation would suggest.

### Dark surfaces are the opposite case

On the navy panels (`#1E2235` — the sidebar, mobile top bar, login and
role-select panels) the **original** bright Figma tones already clear AA
comfortably (5.5–9.5:1), and the darkened tokens would *fail* there (~3.4:1).
Those surfaces therefore use the `-fill` values for text as well:

- `TopBar` role chips use `text-{tone}-fill`
- the login and role-select dark panels use `text-muted-fill`
- the top-bar violet chip uses `primary-400` (6.54:1); both `primary-500`
  (4.10:1) and the darkened text token (2.88:1) fail on navy

## Known residual

Two pairings remain below AA, both deliberate — they are the solid button fills
that were kept exactly as drawn:

| element | pairing | ratio |
|---|---|---|
| white label on the primary button | `#FFFFFF` on `#7C6FF7` | 3.84 |
| white label on the solid success button | `#FFFFFF` on `#00C87A` | 2.20 |

Fixing these means darkening the button fills themselves, which visibly changes
the brand colours. Fills to use if that is ever approved: primary `#6D5EF6`,
success `#008853`, danger `#E52900`.

## Other measures in place

- Skip-to-content link, visible on focus
- `:focus-visible` ring on every interactive element
- Modal: focus trap, Escape to close, background scroll lock, focus restored to
  the trigger on close
- `prefers-reduced-motion` honoured globally
- Semantic landmarks, `aria-current` on active navigation, labelled form
  controls, `role="switch"` toggles, `role="tablist"` filters
- Tables carry `<caption>` elements for screen readers

## Re-running the audit

```bash
pip install axe-playwright-python
npm run build && npm run start
python scripts/a11y.py     # see the scratchpad scripts used during the build
```

The audit runs axe-core over a representative screen for each layout pattern at
both 1440x900 and 390x844, and fails on `serious` or `critical` violations.
