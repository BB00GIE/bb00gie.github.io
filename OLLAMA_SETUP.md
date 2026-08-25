# Local resume summary generation

The private experience page can generate a resume profile summary from selected GitHub project records using Ollama. Employer records are not sent to the model. The generated text is a draft and must be reviewed and explicitly saved.

## Setup

1. Install Ollama from https://ollama.com/download.
2. Pull a local model, for example:

```powershell
ollama pull gemma4:26b
```

3. Start Ollama. Its default API endpoint is `http://127.0.0.1:11434/api/generate`.
4. Open `experience.html`, sign in as the allowlisted GitHub account, and use **Generate summary**.
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

The browser must be allowed to reach Ollama from the page origin. If a browser blocks the request due to CORS, run the site through a local web server and configure Ollama for the local origin, or use an OpenAI-compatible local runtime with its CORS support enabled.
