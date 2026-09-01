#!/usr/bin/env python3
import argparse
import json
from typing import Any, Dict, List
from urllib import request, error


DEFAULT_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_CLEANER_MODEL = "qwen2.5vl:3b"
DEFAULT_BUILDER_MODEL = "qwen2.5:7b-instruct"
DEFAULT_REVIEWER_MODEL = "qwen2.5:7b-instruct"


def ollama_generate(base_url: str, model: str, prompt: str, system: str = "") -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{base_url}/api/generate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=180) as response:
            body = response.read().decode("utf-8")
    except error.URLError as exc:
        raise RuntimeError(f"Unable to reach Ollama at {base_url}. Is Ollama running? {exc}") from exc

    parsed = json.loads(body)
    return parsed.get("response", "")


def parse_json_response(raw: str) -> Any:
    text = raw.strip()
    if not text:
        raise ValueError("Model returned an empty response")

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


def agent_1_clean_experience(raw_entries: List[Dict[str, Any]], base_url: str, model: str) -> Dict[str, Any]:
    system_prompt = """
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
""".strip()

    user_prompt = "Clean and normalize the following raw work experience entries into resume-ready content for a software engineer.\n\n" + json.dumps(raw_entries, indent=2)
    response = ollama_generate(base_url, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def agent_2_build_resume(cleaned_experience: Dict[str, Any], base_url: str, model: str) -> Dict[str, Any]:
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
    response = ollama_generate(base_url, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def agent_3_review_resume(resume: Dict[str, Any], base_url: str, model: str) -> Dict[str, Any]:
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
    response = ollama_generate(base_url, model, user_prompt, system=system_prompt)
    return parse_json_response(response)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a three-agent local resume pipeline through Ollama.")
    parser.add_argument("--raw-file", required=True, help="Path to a JSON file containing raw work experience entries.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Local Ollama base URL.")
    parser.add_argument("--cleaner-model", default=DEFAULT_CLEANER_MODEL, help="Model for the resume cleanup step.")
    parser.add_argument("--builder-model", default=DEFAULT_BUILDER_MODEL, help="Model for the resume building step.")
    parser.add_argument("--reviewer-model", default=DEFAULT_REVIEWER_MODEL, help="Model for the recruiter review step.")
    args = parser.parse_args()

    raw_entries = load_raw_experience(args.raw_file)

    print("\n[1/3] Cleaning raw work experience...\n")
    cleaned = agent_1_clean_experience(raw_entries, args.base_url, args.cleaner_model)
    print(json.dumps(cleaned, indent=2))

    print("\n[2/3] Building software engineer resume...\n")
    resume = agent_2_build_resume(cleaned, args.base_url, args.builder_model)
    print(json.dumps(resume, indent=2))

    print("\n[3/3] Reviewing resume as a recruiter...\n")
    review = agent_3_review_resume(resume, args.base_url, args.reviewer_model)
    print(json.dumps(review, indent=2))


if __name__ == "__main__":
    main()
