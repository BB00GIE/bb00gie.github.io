#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import Any, Dict, List
from urllib import request, error, parse


DEFAULT_MODEL = "gemini-3.8-flash"


def get_gemini_api_key(arg_key: str = "") -> str:
    key = arg_key.strip() or os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        env_file_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_file_path):
            with open(env_file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if key:
                            break
    if not key:
        config_js_path = os.path.join(os.path.dirname(__file__), "gemini-config.js")
        if os.path.exists(config_js_path):
            with open(config_js_path, "r", encoding="utf-8") as f:
                content = f.read()
                import re
                match = re.search(r"apiKey:\s*['\"]([^'\"]+)['\"]", content)
                if match:
                    val = match.group(1).strip()
                    if val and not val.startswith("YOUR_"):
                        key = val
    if not key:
        raise ValueError(
            "Gemini API key is required. Supply it via --api-key, GEMINI_API_KEY environment variable, .env, or gemini-config.js."
        )
    return key


def gemini_generate(api_key: str, model: str, prompt: str, system: str = "", max_output_tokens: int = 4096) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{parse.quote(model)}:generateContent?key={parse.quote(api_key)}"

    contents = [
        {
            "role": "user",
            "parts": [{"text": prompt}],
        }
    ]

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_output_tokens,
            "responseMimeType": "application/json",
        },
    }

    if system:
        payload["systemInstruction"] = {
            "parts": [{"text": system}],
        }

    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=180) as response:
            body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        err_msg = exc.read().decode("utf-8")
        raise RuntimeError(f"Gemini API returned HTTP {exc.code}: {err_msg}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Unable to reach Gemini API: {exc}") from exc

    parsed = json.loads(body)
    candidates = parsed.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"No candidates returned by Gemini: {body}")
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise RuntimeError(f"No content parts returned by Gemini: {body}")
    return parts[0].get("text", "")


def parse_json_response(raw: str) -> Any:
    text = raw.strip()
    if not text:
        raise ValueError("Model returned an empty response")

    # Strip code fences if present
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise


def load_raw_experience(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    if isinstance(payload, dict) and "experience" in payload:
        return payload["experience"]
    if isinstance(payload, list):
        return payload
    raise ValueError("Raw experience file must be a JSON list or object containing 'experience'.")


def agent_1_clean_experience(raw_entries: List[Dict[str, Any]], api_key: str, model: str) -> Dict[str, Any]:
    system_prompt = """
You are an expert technical resume writer and career strategist specializing in software engineering. Convert raw work experience entries, highlights, and notes into polished, ATS-optimized, high-impact resume content.

Guidelines:
- Synthesize raw notes, highlights, and lessons into 3-5 punchy, high-impact resume bullets per role.
- Follow the XYZ impact formula: Accomplished [X], as measured by [Y], by doing [Z].
- Lead each bullet with a strong action verb (e.g. Engineered, Architected, Scaled, Spearheaded, Automated).
- Naturally integrate technologies, frameworks, and methodologies into the achievements.
- Keep bullets substantive and concise (1-2 sentences each).
- Remove vague filler like "worked on" or "helped with" and highlight concrete engineering impact.
- Preserve factual accuracy without inventing ungrounded claims or dates.
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
""".strip()

    user_prompt = "Synthesize and normalize the following raw work experience entries into resume-ready content for a software engineer.\n\n" + json.dumps(raw_entries, indent=2)
    response = gemini_generate(api_key, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def agent_2_build_resume(cleaned_experience: Dict[str, Any], api_key: str, model: str) -> Dict[str, Any]:
    system_prompt = """
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
""".strip()

    user_prompt = "Create a software engineer resume using the following cleaned work experience. Optimize it for a top-tier tech company and include a strong summary, relevant skills, and a short list of projects if available.\n\n" + json.dumps(cleaned_experience, indent=2)
    response = gemini_generate(api_key, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def agent_3_review_resume(resume: Dict[str, Any], api_key: str, model: str) -> Dict[str, Any]:
    system_prompt = """
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
""".strip()

    user_prompt = "Review this resume as if I were submitting it to a top tech company. Give honest feedback on how to improve it for a software engineer role.\n\n" + json.dumps(resume, indent=2)
    response = gemini_generate(api_key, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a three-agent resume pipeline through Google Gemini.")
    parser.add_argument("--raw-file", required=True, help="Path to a JSON file containing raw work experience entries.")
    parser.add_argument("--api-key", default="", help="Google Gemini API key (or set GEMINI_API_KEY environment variable).")
    parser.add_argument("--cleaner-model", default=DEFAULT_MODEL, help="Model for the resume cleanup step.")
    parser.add_argument("--builder-model", default=DEFAULT_MODEL, help="Model for the resume building step.")
    parser.add_argument("--reviewer-model", default=DEFAULT_MODEL, help="Model for the recruiter review step.")
    args = parser.parse_args()

    api_key = get_gemini_api_key(args.api_key)
    raw_entries = load_raw_experience(args.raw_file)

    print("\n[1/3] Cleaning raw work experience with Gemini...\n")
    cleaned = agent_1_clean_experience(raw_entries, api_key, args.cleaner_model)
    print(json.dumps(cleaned, indent=2))

    print("\n[2/3] Building software engineer resume with Gemini...\n")
    resume = agent_2_build_resume(cleaned, api_key, args.builder_model)
    print(json.dumps(resume, indent=2))

    print("\n[3/3] Reviewing resume as a recruiter with Gemini...\n")
    review = agent_3_review_resume(resume, api_key, args.reviewer_model)
    print(json.dumps(review, indent=2))


if __name__ == "__main__":
    main()
