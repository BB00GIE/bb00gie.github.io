# Local resume writing assistance

The private experience page can generate a complete resume draft from all work experience included in the resume using Ollama. **Generate resume** creates a profile summary and synthesizes each role's line-by-line highlights into 3-5 resume bullets, then opens a preview without changing saved data until you approve and save it. Use **Re-word with AI** beside a saved role to generate and review a polished description and resume bullets for that role. Employer records are sent only to your local model.

GitHub repositories are grouped using the same prefix rule as the blog: the portion before the first underscore is the shared project name. For example, `portfolio`, `portfolio_api`, and `portfolio_web` become one work-experience entry, and project updates from all matching repository names are included in that entry.

## Setup

1. Install Ollama from https://ollama.com/download.
2. Pull a local model, for example:

```powershell
ollama pull gemma4:26b
```

3. Start Ollama. Its default API endpoint is `http://127.0.0.1:11434/api/generate`.
4. Open `experience.html`, sign in as the allowlisted GitHub account, and use **Re-word with AI** beside a saved role or **Generate resume** for the full resume.
5. Run the `resume_profile` additions in `supabase.sql` before saving an approved summary.

When using the deployed site at `https://bb00gie.github.io`, Ollama must allow that browser origin. In PowerShell, configure the origin once and then fully restart Ollama:

```powershell
setx OLLAMA_ORIGINS "https://bb00gie.github.io,http://localhost:5500,http://127.0.0.1:5500"
```

If Ollama is being run directly in a terminal instead of through the desktop app, set it for that terminal before starting the server:

```powershell
$env:OLLAMA_ORIGINS = 'https://bb00gie.github.io,http://localhost:5500,http://127.0.0.1:5500'
ollama serve
```

Only the computer running Ollama can generate the draft. Visitors to the public site cannot use your local model.

The default model and endpoint are defined in `experience.js` through `RESUME_AI_CONFIG`. To override them without changing the generator, define `window.RESUME_AI_CONFIG` before `experience.js` loads:

```html
<script>
  window.RESUME_AI_CONFIG = {
    endpoint: 'http://127.0.0.1:11434/api/generate',
    model: 'gemma4:26b'
  };
</script>
```

The browser must be allowed to reach Ollama from the page origin. Some regular browsers block a hosted HTTPS page from reaching a local HTTP service even when Ollama CORS is configured. The VS Code built-in browser allows this local workflow; alternatively, run the site through a local web server and open `http://localhost:5500/experience.html` directly. The public GitHub Pages URL remains a read-only viewer for browsers that block local connections.
