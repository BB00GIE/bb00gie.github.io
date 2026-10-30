# Google Gemini resume writing assistance & AI tooling

The private experience page (`experience.html`) and the Python CLI pipeline can generate and polish resume entries, summaries, and full resume drafts using Google Gemini.

- **Generate tailored resume**: Runs a 3-agent pipeline (Cleaner -> Builder -> Reviewer) that normalizes experience bullets, optionally aligns them against a pasted target job listing, writes a targeted summary and 3-4 bullets per role, and grades the draft as a top-tech recruiter with match score.
- **Generate summary only**: Synthesizes verified GitHub projects into a professional 2-3 sentence profile summary and bullets.
- **AI Polish & Re-word**: Rewrites raw highlights into concise, high-impact resume bullets right inside the experience editor drawer.
- **Synthesize GitHub projects**: Uses Gemini (Agent 1) to format collected GitHub repository commits, PRs, and journal entries into clean, verified project records.

---

## Configuration & API Key

### 1. In the Web App (`experience.html`)

Create or update `gemini-config.js` in the project root:

```javascript
window.GEMINI_CONFIG = {
  apiKey: 'YOUR_GEMINI_API_KEY',
  model: 'gemini-2.5-flash'
};
```

*(Note: `gemini-config.js` is included in `.gitignore` to prevent committing your secret API key).*

### 2. In the Python CLI Agent (`gemini_resume_agents.py`)

You can provide your Gemini API key in any of three ways:
1. Environment variable:
   ```powershell
   $env:GEMINI_API_KEY = "your-api-key"
   ```
2. `.env` file in the project root:
   ```text
   GEMINI_API_KEY=your-api-key
   ```
3. Command line argument:
   ```powershell
   python gemini_resume_agents.py --raw-file examples/resume_raw.json --api-key "your-api-key"
   ```

---

## Python CLI Usage

Run the 3-agent pipeline on a raw experience JSON file:

```powershell
python gemini_resume_agents.py --raw-file examples/resume_raw.json
```

Optional arguments:
- `--model`: Change the Gemini model (defaults to `gemini-2.5-flash`).
- `--cleaner-model`, `--builder-model`, `--reviewer-model`: Configure specific models for each step in the pipeline.

---

## Deployment to Live GitHub Pages with Supabase Edge Functions

To run the AI tooling securely on your live site (`https://bb00gie.github.io/experience.html`) without exposing your Gemini API key:

### 1. Set the Gemini Secret in Supabase
In your Supabase project dashboard:
- Go to **Project Settings** -> **Edge Functions** (or **Vault** -> **Secrets**)
- Add a new secret:
  - Name: `GEMINI_API_KEY`
  - Value: `your-gemini-api-key`

### 2. Deploy the Edge Function
The function code is located at `supabase/functions/gemini-proxy/index.ts`.
Deploy it with the Supabase CLI:

```powershell
npx supabase functions deploy gemini-proxy --project-ref uedpqgzejbfkybtbhotp
```

### 3. How It Works
When visiting `https://bb00gie.github.io/experience.html`:
1. You sign in with your authorized GitHub account (`BB00GIE`).
2. When you click **Generate tailored resume**, **AI Polish**, or any Gemini action, the web app invokes the `gemini-proxy` Supabase Edge Function with your session token.
3. The Edge Function verifies your identity against `allowed_authors`, reads `GEMINI_API_KEY` from its server-side environment, calls Google Gemini, and returns the response.
4. Your API key stays 100% server-side and is never exposed in the browser network tab or repository.

