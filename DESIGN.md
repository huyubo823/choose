# Design

## Visual Theme

精致、现代、简约 — Tesla App 式的留白与克制，红色作为唯一的品牌强调。纯白画布上，一道红刃。

**情绪**：精工厨刀落在白瓷台面上 — clean, sharp, warm restraint

## Color Palette

| Token | OKLCH | Role |
|-------|-------|------|
| `--color-bg` | `oklch(1 0 0)` | 主背景，纯白 |
| `--color-surface` | `oklch(0.97 0 0)` | 卡片、面板、分隔区域 |
| `--color-ink` | `oklch(0.15 0 0)` | 正文，近黑 |
| `--color-primary` | `oklch(0.52 0.185 355)` | 品牌红，按钮、强调、选中态 |
| `--color-primary-hover` | `oklch(0.47 0.195 355)` | 红色悬停态，稍深 |
| `--color-primary-subtle` | `oklch(0.95 0.02 355)` | 红色极浅底，选中卡片背景 |
| `--color-accent` | `oklch(0.55 0.08 75)` | 暖金棕，标签、分类、次要高亮 |
| `--color-accent-subtle` | `oklch(0.95 0.03 75)` | 暖金浅底 |
| `--color-muted` | `oklch(0.55 0 0)` | 辅助文字、说明 |
| `--color-border` | `oklch(0.88 0 0)` | 分割线、边框 |
| `--color-success` | `oklch(0.55 0.14 160)` | 完成/已选状态 |
| `--color-error` | `oklch(0.50 0.18 30)` | 错误状态 |

**Color strategy**: Restrained — primary red ≤10% of surface area. Point accents only.

**Light mode only** — this app is used in daytime kitchens, not dark rooms.

## Typography

**Font stack**: System UI (no external fonts — fastest load, best native rendering on mobile)

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
  "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif;
```

**Scale** (mobile-first, 16px base):

| Level | Size | Weight | Line-height | Use |
|-------|------|--------|-------------|-----|
| Display | `clamp(2rem, 5vw, 3rem)` | 700 | 1.15 | 情景词大字 |
| H1 | `clamp(1.5rem, 4vw, 2rem)` | 600 | 1.2 | 页面主标题 |
| H2 | `1.25rem` | 600 | 1.3 | 区块标题 |
| Body | `1rem` | 400 | 1.6 | 正文 |
| Body-sm | `0.875rem` | 400 | 1.5 | 辅助说明 |
| Caption | `0.75rem` | 500 | 1.4 | 标签、小字 |
| Caption-uppercase | `0.6875rem` | 600, letter-spacing 0.04em | 1.4 | 食材分类标签 |

- `text-wrap: balance` on h1–h3
- Max line length 65ch for body text
- Display heading letter-spacing ≥ -0.02em

## Layout & Spacing

**Spacing scale** (4px base):
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 48px
- `--space-3xl`: 64px

**Page structure**: Single column, max-width 480px centered on larger screens. Vertical flow, no horizontal scroll.

**Section rhythm**: Generous padding between sections (32-48px), compact within (16-24px). White space is the primary visual separator — borders used sparingly.

## Components

### 情景词卡片 (Scenario Word Card)
- Large, nearly full-width card with generous padding
- Display-size Chinese word centered
- Subtle hover/focus ring in primary red
- Selected state: primary-subtle background, primary border

### 菜谱卡片 (Recipe Card)
- Surface background, subtle border
- Recipe name + flavor tags (accent color)
- Ingredient count badge
- Checkbox for selection
- Selected state: primary-subtle background

### 食材清单 (Ingredient List)
- Grouped by category (肉类/蔬菜/调料/特殊)
- Category header with caption-uppercase
- Each item: name + amount, muted for common items, primary emphasis for special items
- Total count summary at top

### 按钮 (Button)
- Primary: solid primary red, white text, rounded 8px
- Secondary: white, primary red border, primary red text
- Tertiary: text-only, primary red, no border
- Min touch target 44×44px
- Active: scale(0.97) transition

### 页面指示器 (Progress Dots)
- Three dots for three steps (词 → 菜谱 → 清单)
- Active: primary red filled
- Inactive: border only
- Completed: success green with subtle check

## Interaction & Motion

- Page transitions: 200ms ease-out fade + slight Y shift (10px)
- Card tap: 150ms scale(0.98), release with spring
- Selection toggle: instant background change, no animation (performance)
- "换一批" shuffle: stagger-fade cards one by one (50ms delay each)
- All animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- Reduced motion: instant transitions

## Responsive Behavior

- Single column, max-width 480px
- Above 480px: centered with subtle page-level shadow (like a phone in a case)
- Touch targets ≥ 44×44px throughout
- No hover-dependent interactions (mobile-first)
- System font scaling respected (rem-based)
