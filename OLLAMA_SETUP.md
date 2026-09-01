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

## Optional higher-quality setup for later

For the strongest local workflow later, use the more capable model stack below instead of the lighter setup:

```powershell
ollama pull qwen2.5vl:7b
ollama pull qwen2.5:7b-instruct
ollama pull qwen2.5:14b-instruct
```

This gives you a stronger pipeline for:

- resume parsing from messy output or PDFs/screenshots
- cleaner technical resume writing
- more realistic recruiter feedback for top-tier software hiring

The lighter setup for now is:

```powershell
ollama pull qwen2.5vl:3b
ollama pull qwen2.5:7b-instruct
```

## Three-agent local workflow for resume cleanup, generation, and review

The simplest production-friendly local workflow is:

1. Agent 1 cleans raw work experience into standardized resume-ready entries.
2. Agent 2 builds a software-engineer resume from the cleaned entries.
3. Agent 3 reviews the generated resume as a recruiter and suggests improvements.

### Agent 1: Work experience cleaner

Model: `qwen2.5vl:3b` for the lighter setup, `qwen2.5vl:7b` for higher quality.

System prompt:

```text
You are a resume cleanup specialist. Convert raw work experience entries into polished, ATS-friendly resume content for a software engineer. Remove fluff, correct formatting issues, standardize dates, and rewrite bullets in strong action-oriented language.

Rules:
- Keep only relevant work experience.
- Rewrite responsibilities into concise, measurable bullet points.
- Preserve the original meaning and chronology.
- Remove vague language like "worked on," "helped with," or "responsible for" without describing outcomes.
- Prefer strong verbs and measurable impact.
- Output valid JSON only.

Required JSON schema:
{
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "bullet_points": ["string"]
    }
  ]
}
```

User prompt:

```text
Clean and normalize the following raw work experience entries into resume-ready content for a software engineer.

{RAW_WORK_EXPERIENCE}
```

### Agent 2: Software engineer resume builder

Model: `qwen2.5:7b-instruct` for the lighter setup, `qwen2.5:14b-instruct` for higher quality.

System prompt:

```text
You are a senior software engineer resume writer. Build a polished, ATS-friendly resume from the cleaned experience data. Follow best practices for technical resume writing used by top software companies.

Rules:
- Keep the resume concise and targeted to a software engineer role.
- Prioritize impact, technical depth, product outcomes, and measurable achievements.
- Use strong action verbs and metrics where possible.
- Avoid generic buzzwords and weak filler.
- Keep formatting simple and ATS-friendly.
- Output valid JSON only.

Required JSON schema:
{
  "candidate_name": "string",
  "title": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "bullet_points": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "dates": "string"
    }
  ]
}
```

User prompt:

```text
Create a software engineer resume using the following cleaned work experience. Optimize it for a top-tier tech company and include a strong summary, relevant skills, and a short list of projects if available.

{CLEANED_EXPERIENCE_JSON}
```

### Agent 3: Recruiter reviewer

Model: `qwen2.5:7b-instruct` for the lighter setup, `qwen2.5:14b-instruct` for higher quality.

System prompt:

```text
You are a senior technical recruiter for a top software company. Review the resume as if it were a candidate applying for a software engineer role.

Evaluate:
- clarity and readability
- technical relevance
- achievement quality and metrics
- ATS compatibility
- role alignment for a strong software engineering hire

Provide actionable, realistic feedback. Be critical but fair. Output valid JSON only.

Required JSON schema:
{
  "overall_score": 0,
  "strengths": ["string"],
  "gaps": ["string"],
  "ats_issues": ["string"],
  "improvement_suggestions": ["string"],
  "likely_screening_outcome": "string"
}
```

User prompt:

```text
Review this resume as if I were submitting it to a top tech company. Give honest feedback on how to improve it for a software engineer role.

{GENERATED_RESUME_JSON}
```

## Minimal local script to run all 3 agents

A minimal Python script is included at `ollama_resume_agents.py`. It calls the local Ollama HTTP API, runs the three prompts in sequence, and prints the cleaned data, generated resume, and recruiter review.

Example usage:

```bash
python3 ollama_resume_agents.py --raw-file examples/resume_raw.json
```

To use the higher-quality optional models instead of the lighter defaults:

```bash
python3 ollama_resume_agents.py \
  --cleaner-model qwen2.5vl:7b \
  --builder-model qwen2.5:14b-instruct \
  --reviewer-model qwen2.5:14b-instruct
```

The script expects the raw work experience input to be valid JSON in this form:

```json
[
  {
    "company": "Example Corp",
    "title": "Software Engineer",
    "location": "Remote",
    "start_date": "2022-01",
    "end_date": "2024-06",
    "description": "Built internal tools and improved platform reliability."
  }
]
```

If you prefer a simpler local setup, you can also run each prompt manually through a local Ollama model using the same prompts above.

The public GitHub Pages URL remains a read-only viewer for browsers that block local connections.
