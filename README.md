# 📝 TaskFlow

TaskFlow is a modern, responsive **Todo List Web App** built with plain **HTML, CSS, and JavaScript**.
It helps you capture tasks quickly, prioritize work, and manage completion with a clean and interactive UI.

---

## ✨ Features

- Add tasks with **priority** (High / Medium / Low)
- Mark tasks complete with visual feedback
- **Inline edit** tasks (double-click or keyboard Enter)
- Delete task with **Undo** toast
- Clear completed tasks with **Undo**
- **Filter** tasks: All / Active / Completed
- **Sort** tasks: Newest / Oldest / Priority High→Low / Priority Low→High
- Markdown support in task text (`marked`) with sanitization (`DOMPurify`)
- Theme toggle (light/dark preference persisted)
- Local persistence using `localStorage`
- Empty state messaging + active/total task counter
- Accessible labels, keyboard focus states, and live-region updates
- Reduced motion support (`prefers-reduced-motion`)

---

## 📁 Project Structure

```text
TaskFlow/
├── index.html      # App structure and controls
├── style.css       # Styling, theme variables, responsive rules, accessibility helpers
├── script.js       # App state, rendering, events, storage, filtering/sorting logic
└── README.md
```

---

## 🚀 How to Run

1. Clone the repository
2. Open the project folder
3. Launch `index.html` in your browser

Or from terminal (Windows):

```bash
start c:\Users\rohith\Desktop\TaskFlow\index.html
```

---

## ⌨️ Usage Guide

1. Type your task and choose priority.
2. Press **Add** (or Enter in input).
3. Use checkbox to mark complete.
4. Use filter buttons to view specific task states.
5. Use sort dropdown to reorder visible tasks.
6. Double-click task text to edit:
   - **Enter** = save
   - **Escape** = cancel
7. Delete task and use **Undo** if needed.
8. Click **Clear Completed** to remove completed items (also undoable).

---

## 🧠 Technical Notes

- Data model includes:
  - `id`
  - `text`
  - `completed`
  - `priority`
  - `createdAt`
- Storage is loaded safely with fallback guards (`try/catch` + normalization)
- Rendering uses `DocumentFragment` for better performance
- Event delegation is used for scalable list interactions

---

## ♿ Accessibility Improvements

- ARIA labels for controls
- `aria-live` for toast/counter/empty-state announcements
- Keyboard-edit support for tasks
- Focus-visible outlines for keyboard users
- Reduced motion mode support for users who prefer minimal animation

---

## 🔒 Security Notes

- Markdown rendering is sanitized with **DOMPurify** before insertion.
- For production-grade deployment, consider:
  - Pinning library versions strictly
  - Adding Subresource Integrity (SRI)
  - Optionally bundling dependencies locally instead of using CDN links

---

## 📌 Future Enhancements

- Due dates and overdue highlighting
- Drag-and-drop ordering
- Category tags and advanced search
- Export/import tasks
- Unit tests and CI automation

---

## 👨‍💻 Author

Developed by **Rohith**
