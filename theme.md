# Catalyst Cozy UI Theme

## Brand Mood

Catalyst should feel cozy, modern, clean, and fresh. The product combines structured work like Notion with spatial thinking like Miro, so screens should feel calm enough for deep work and bright enough for creative momentum.

## Color Palette

- Background: `--background`, `hsl(42 54% 97%)`, warm off-white for the main app shell.
- Surface: `--card`, `hsl(0 0% 100%)`, clean white cards and panels.
- Text: `--foreground`, `hsl(217 27% 18%)`, muted ink for strong readability.
- Primary: `--primary`, `hsl(214 82% 54%)`, fresh blue for primary actions and selected states.
- Secondary: `--secondary`, `hsl(190 43% 93%)`, pale sky for calm fills.
- Accent: `--accent`, `hsl(166 57% 92%)`, soft mint for hover states and gentle highlights.
- Border: `--border`, `hsl(210 31% 88%)`, low-contrast dividers.
- Coral: `--coral-400`, `hsl(8 83% 66%)`, warm creative accent.
- Mint: `--mint-100`, `hsl(153 56% 90%)`, positive status and workspace accents.

Use colorful Lucide icons to make navigation scannable, but keep large surfaces quiet and mostly neutral.

## Typography

- Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Page titles: 24-28px, semibold, natural line height.
- Section titles: 16-20px, semibold.
- Sidebar labels: 13px or smaller for compact navigation.
- Metadata and helper text: 11-14px in muted foreground.
- Letter spacing should remain `0` except for tiny uppercase group labels.

## Spacing And Shape

- Use 4px spacing increments for dense productivity surfaces.
- Sidebar width: about 244px expanded and 76px collapsed.
- Cards and buttons should generally use 6-8px radius.
- Prefer subtle borders and soft shadows over heavy elevation.
- Do not nest decorative cards inside cards; repeated items, widgets, modals, and tool panels can be framed.

## Navigation Guidelines

- Group sidebar links with compact labels: Workspace, Create, and System.
- Collapsed sidebar should show centered icons only.
- Active navigation uses a quiet tinted background and a distinct icon color.
- Keep row heights compact, around 36px, to support a tool-like productivity feel.

## Future Screen Notes

- Dashboard: prioritize quick actions, current focus, and recent work.
- Kanban: use restrained columns with clear status colors and compact cards.
- Notes: make writing space calm, with minimal chrome and strong hierarchy.
- Whiteboard: maximize canvas area and keep toolbars icon-first.
- AI Template Builder: make prompts, generated structure, and preview states easy to compare.
