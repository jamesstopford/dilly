# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dilly** is a lightweight, fully client-side daily task/habit tracker web application. Pure vanilla JavaScript (ES6+), HTML5, and CSS3 - no frameworks, no backend, no build tools. All data persists in browser `localStorage`.

Core philosophy: Minimalist, fast, "hacker" aesthetic, instantly usable.

## Development Commands

Since this is a pure client-side app with no build process:

- **Run the app**: Open `index.html` directly in a browser, or serve locally:
  ```bash
  python3 -m http.server 8000
  # or
  npx serve .
  ```
  Then navigate to `http://localhost:8000`

- **No build, lint, or test commands** in v1 - this is vanilla JS with no tooling

## Architecture

### File Structure

```
index.html
resources/
  dilly.ico        # Favicon
  dilly.jpg        # Image displayed in Edit Template view
css/
  style.css        # Main styles
  themes.css       # 7 theme definitions (Hacker, Plain, Tokyo Night, Gruvbox, Nord, Catppuccin, Dracula)
js/
  main.js          # App initialization, routing, event binding
  storage.js       # localStorage load/save helpers
  render.js        # DOM builders for lists/cards
  dragdrop.js      # Reorder logic (HTML5 Drag and Drop API)
  template.js      # Edit Template view logic
  utils.js         # ID generation, date formatting, etc.
```

### Data Model

All data stored in `localStorage` under key `"dilly-data"` as JSON:

```json
{
  "template": [/* array of item objects with id, title, category, order */],
  "categories": [/* 5 seeded + up to 5 custom, each with name and emoji */],
  "currentDay": {
    "dateString": "YYYY-MM-DD",
    "pending": [/* array of item IDs in current order */],
    "done": {/* map of item ID → ISO timestamp */},
    "oneOffItems": [/* array of one-off item objects (id, title, category) - only for today */]
  },
  "settings": {
    "theme": "hacker" // hacker, plain, tokyo-night, gruvbox, nord, catppuccin, or dracula
  }
}
```

### Key Technical Details

- **IDs**: Use `crypto.randomUUID()` for unique item IDs (with timestamp fallback)
- **Drag-and-drop**: Native HTML5 Drag and Drop API - no libraries
- **Categories**: 5 seeded (Fitness 💪, Health 🍎, Work 💻, Chore 🧹, Social 👥) + up to 5 custom = max 10 total
- **Icons**: Unicode emojis only - no external assets
- **Emoji Picker**: Uses `emoji-picker-element` library for easy emoji selection in category management
- **Theming**: 7 themes available (Hacker, Plain, Tokyo Night, Gruvbox, Nord, Catppuccin, Dracula) - CSS class swap on `<body>` element
- **One-Off Tasks**: Items stored in `currentDay.oneOffItems` array, not in template. `getTemplateItemById()` checks both template and oneOffItems

### Views

**Daily View** (default):
- Progress bar in header showing X/Y completed
- "+ One-Off Task" button to add tasks for today only
- Pending items section (draggable cards with Done button)
- Done items section (grayed cards with Undo button and timestamps)

**Edit Template View**:
- Draggable list of all template items
- Each row: drag handle, category dropdown, title input, delete button
- Bottom controls: Add Item, Manage Categories (modal), Back to Today

### Important Behaviors

**Daily Reset** (manual only via "Reset Day" button):
- Sets `currentDay.dateString` to today
- Resets `pending` to full template order
- Clears `done` map and `oneOffItems` array
- Always confirm before resetting

**One-Off Tasks**:
- Created via "+ One-Off Task" button in Daily View
- Exist only for current day - cleared on daily reset
- Editable inline (title and category can be changed directly in the card)
- Show category dropdown (emoji) instead of static emoji
- Category dropdown options show tooltips with category names on hover
- Menu icon (⋮) reveals "Delete" option in popover
- Can be dragged, marked done/undone just like template items
- Empty title on blur causes task to be deleted automatically
- Done button disabled until title is entered

**Template Task Actions**:
- Menu icon (⋮) on pending template items reveals "Skip Today" option
- Skip Today: removes task from today's pending list without affecting template
- Skipped tasks reappear on next daily reset

**Template Edit Impact on Current Day**:
- Deleted template items → removed from pending
- New template items → appended to end of pending
- Reordered template → pending list reordered to match
- Title/category changes → immediately reflected in pending cards
- Done items always remain untouched

**Category Management**:
- Manage Categories modal accessed via "Manage Categories" button in Edit Template view
- Click on any emoji input field to launch emoji picker popup
- Picker positioned below the input with search and categorized emoji selection
- Selected emoji automatically saved to category
- Seeded category names are read-only; custom category names and all emojis are editable

**Drag-and-Drop**:
- Daily View: only within pending list (runtime reordering)
- Edit Template View: reorders master template (affects future resets and syncs to current pending)

## Constraints

- Minimal dependencies: only `emoji-picker-element` (loaded via CDN) for emoji selection UI
- No build process or transpilation
- No mobile-specific optimizations in v1
- No backend or sync between devices
- localStorage only (per-browser persistence)
