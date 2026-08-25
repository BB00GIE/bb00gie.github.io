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
