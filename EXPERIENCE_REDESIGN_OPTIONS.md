# Experience Page Redesign Concept Notes

## Selected Approach
- **Option 1: Slide-Over Drawer (Active Implementation)**
  - Retains the full timeline/career list on the main page.
  - A prominent `+ Add Role` action opens a focused right-hand drawer (modal overlay on mobile/responsive).
  - Highlights use dynamic, individually manageable bullet items instead of one giant unstructured textarea.
  - Secondary bulk actions (Resume import, Repo synthesis, Resume generator) are grouped into a clean toolbar instead of sprawling on top of the form.

---

## Alternative Options for Future Testing

### Option 2: 2-Column Split Studio (Live Resume Card Preview)
- **Concept:** Left column contains the structured input; right column live-renders how the experience appears on the website and resume.
- **Key benefits:** Immediate visual feedback on bullet length, typography, and tag formatting. Great for fine-tuning resume wording against character/line limits.
- **Implementation ideas:**
  - CSS Grid `1fr 1fr` on desktop, stacking on mobile.
  - `input` / `change` event listeners feeding a live mock `<article class="experience-entry">` and `<section class="resume-role">`.

### Option 3: Guided 3-Step Wizard Card
- **Concept:** Multi-step wizard breaking role creation into bite-sized tasks.
  - Step 1: Company, Role, Location, Start Date, End Date, Currently Working Here checkbox.
  - Step 2: Accomplishments & Highlights with Ollama Polish / AI bullet generation inline.
  - Step 3: Technologies, Lessons Learned, Repo links, and Resume toggle.
- **Key benefits:** Lowest cognitive load, especially useful when writing detailed bullets from scratch.
