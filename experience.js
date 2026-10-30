const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig && !supabaseConfig.url.includes('YOUR-PROJECT')
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
const authStatus = document.querySelector('#auth-status');
const signIn = document.querySelector('#sign-in');
const signOut = document.querySelector('#sign-out');
const accessMessage = document.querySelector('#access-message');
const experienceContent = document.querySelector('#experience-content');
const experienceForm = document.querySelector('#experience-form');
const experienceList = document.querySelector('#experience-list');
const experienceCount = document.querySelector('#experience-count');
const formHeading = document.querySelector('#form-heading');
const drawerTitle = document.querySelector('#drawer-title');
const formMessage = document.querySelector('#form-message');
const cancelEdit = document.querySelector('#cancel-edit');
const openNewRole = document.querySelector('#open-new-role');
const toggleTools = document.querySelector('#toggle-tools');
const experienceToolsBar = document.querySelector('#experience-tools-bar');
const toggleSummaryPanel = document.querySelector('#toggle-summary-panel');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const experienceDrawer = document.querySelector('#experience-drawer');
const drawerClose = document.querySelector('#drawer-close');
const bulletsContainer = document.querySelector('#bullets-container');
const addBulletBtn = document.querySelector('#add-bullet-btn');
const polishBulletsAi = document.querySelector('#polish-bullets-ai');
const rewordExperienceAi = document.querySelector('#reword-experience-ai');
const isCurrentRoleCheckbox = document.querySelector('#is-current-role');
const importResume = document.querySelector('#import-resume');
const synthesizeRepos = document.querySelector('#synthesize-repos');
const generateResume = document.querySelector('#generate-resume');
const targetJobListing = document.querySelector('#target-job-listing');
const summaryGenerator = document.querySelector('#summary-generator');
const generateSummary = document.querySelector('#generate-summary');
const saveSummary = document.querySelector('#save-summary');
const publishResume = document.querySelector('#publish-resume');
const summaryReview = document.querySelector('#summary-review');
const summaryReviewLabel = document.querySelector('#summary-review-label');
const summarySourceCount = document.querySelector('#summary-source-count');
const summaryMessage = document.querySelector('#summary-message');
const resumeDraftReview = document.querySelector('#resume-draft-review');
const resumeDraftRoles = document.querySelector('#resume-draft-roles');
const resumeAiConfig = {
  model: 'gemini-3.8-flash',
  cleanerModel: 'gemini-3.8-flash',
  builderModel: 'gemini-3.8-flash',
  reviewerModel: 'gemini-3.8-flash',
  builderOutputTokens: 4096,
  ...(window.GEMINI_CONFIG || window.RESUME_AI_CONFIG)
};
const experienceGenerator = document.querySelector('#experience-generator');
const experienceReview = document.querySelector('#experience-review');
const originalHighlights = document.querySelector('#original-highlights');
const originalDescription = document.querySelector('#original-description');
const removedHighlightsReview = document.querySelector('#removed-highlights-review');
const removedHighlights = document.querySelector('#removed-highlights');
const generatedDescription = document.querySelector('#generated-description');
const changeReason = document.querySelector('#change-reason');
const generatedBullets = document.querySelector('#generated-bullets');
const keepGeneratedDescription = document.querySelector('#keep-generated-description');
const keepGeneratedBullets = document.querySelector('#keep-generated-bullets');
const experienceMessage = document.querySelector('#experience-message');
let editingExperience = null;
let experiences = [];
let currentSession = null;
let isAllowedEditor = false;
let generatedProjectBullets = [];
let generatedExperienceBullets = [];
let generatedResumeBullets = [];
let originalResumeBullets = [];
let originalExperienceDescription = '';
let generatedExperienceDescription = '';
const resumeExperiences = [
  {
    company: 'Google',
    role: 'Full-Stack Software Engineer',
    location: null,
    start_date: '2022-06-01',
    end_date: '2026-08-01',
    description: 'Worked on the Core Shopping team designing and scaling natural language understanding data pipelines, user experience enhancements, and AI recommendations for Google Search.',
    highlights: [
      'Scaled natural language understanding (NLU) pipelines for shopping intents from 5 to 31 international locales, expanding product reach to 10M+ daily active users in close collaboration with product managers and research teams.',
      'Architected Java backend data pipelines and TypeScript/React UI enhancements for Autobuy product cards in partnership with UX designers, processing 500k+ daily notifications via CI/CD pipelines.',
      'Spearheaded A/B testing initiatives during cross-functional Agile ceremonies to evaluate new shopping intent selector chips, achieving a 5% increase in Deals journeys.',
      'Implemented an automated release scheduling system with integrated automated testing frameworks, guaranteeing 100% adherence to EU regulatory standards across all feature launches.',
      'Partnered with product managers to design AI prompts for AI mode (AIM), enabling intent detection and high-volume lookups to surface complementary product recommendations.'
    ],
    lessons_learned: [],
    technologies: ['C++', 'Java', 'Python', 'TypeScript', 'React', 'SQL', 'Git'],
    source_repo: null,
    sort_order: 0
  },
  {
    company: 'Amazon (EC2)',
    role: 'Software Engineer Intern',
    location: 'Seattle, WA',
    start_date: '2021-05-01',
    end_date: '2021-08-01',
    description: 'Designed and deployed proactive autoscaling solutions on AWS EC2 to optimize provisioning latency and system availability.',
    highlights: [
      'Designed and deployed a proactive autoscaling algorithm on AWS EC2, cutting server provisioning latency by 20% during high-volume traffic surges.',
      'Mitigated high-latency buffer times and sustained 99.99% enterprise system availability for major partners handling over 1M concurrent requests during peak events.',
      'Conducted in-depth data analysis and facilitated technical code reviews, partnering with cross-functional engineering leads to gain approval for production deployment.'
    ],
    lessons_learned: [],
    technologies: ['AWS', 'EC2', 'Java', 'Python', 'C++'],
    source_repo: null,
    sort_order: 1
  },
  {
    company: 'Delaware State University',
    role: 'Computer Science Tutor & Teaching Assistant',
    location: null,
    start_date: '2019-01-01',
    end_date: '2022-05-01',
    description: 'Facilitated small-group study sessions and provided one-on-one instruction and peer mentorship in Data Structures and foundational Computer Science concepts.',
    highlights: [
      'Facilitated small-group study sessions and provided one-on-one instruction in Data Structures.',
      'Guided students through foundational Computer Science concepts and provided ongoing peer mentorship.',
      'Transitioned tutoring operations seamlessly across in-person, remote lockdown, and hybrid environments, leveraging virtual collaboration tools (e.g., Zoom, Discord) to maintain uninterrupted academic support and peer mentorship.'
    ],
    lessons_learned: [],
    technologies: ['Python', 'Java', 'Data Structures'],
    source_repo: null,
    sort_order: 2
  }
];

const showMessage = (message) => {
  formMessage.hidden = false;
  formMessage.textContent = message;
};

const parseAiJson = (text) => {
  if (!text || !text.trim()) throw new Error('The model returned an empty response.');

  const stripCodeFence = (value) => value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const recoverTruncatedObject = (value) => {
    const truncated = value.trim();
    if (!truncated.startsWith('{')) return null;

    const summaryMatch = truncated.match(/"summary"\s*:\s*"((?:\\.|[^"\\])*)/);
    if (summaryMatch) {
      return { summary: summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') };
    }

    const keyMatch = truncated.match(/"([A-Za-z0-9_-]+)"\s*:\s*"((?:\\.|[^"\\])*)/);
    if (keyMatch) {
      return { [keyMatch[1]]: keyMatch[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') };
    }

    return null;
  };

  const uniqueCandidates = new Set();
  const trimmed = stripCodeFence(String(text).trim());

  const addCandidate = (candidate) => {
    if (!candidate || !candidate.trim()) return;
    const normalized = candidate.trim();
    if (!uniqueCandidates.has(normalized)) uniqueCandidates.add(normalized);
  };

  addCandidate(trimmed);

  const firstJsonIndex = trimmed.search(/[\[{]/);
  if (firstJsonIndex >= 0) {
    const fromFirstBracket = trimmed.slice(firstJsonIndex);
    addCandidate(fromFirstBracket);
    addCandidate(fromFirstBracket.replace(/,\s*([}\]])/g, '$1'));

    const partial = recoverTruncatedObject(fromFirstBracket);
    if (partial) addCandidate(JSON.stringify(partial));

    let balance = '';
    let stack = [];
    let inString = false;
    let escaped = false;
    for (let index = 0; index < fromFirstBracket.length; index += 1) {
      const char = fromFirstBracket[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === '{' || char === '[') {
        stack.push(char);
        balance += char;
      } else if (char === '}' || char === ']') {
        const expected = char === '}' ? '{' : '[';
        if (stack.length && stack[stack.length - 1] === expected) {
          stack.pop();
          balance += char;
        } else {
          break;
        }
      }
    }
    if (balance) {
      addCandidate(fromFirstBracket.slice(0, balance.length ? fromFirstBracket.length : firstJsonIndex + 1));
    }

    const fallback = fromFirstBracket.slice(0, Math.max(1, fromFirstBracket.lastIndexOf('}') + 1));
    if (fallback && fallback !== fromFirstBracket) addCandidate(fallback);
  }

  for (const candidate of uniqueCandidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Keep trying the cleaned variants below.
    }
  }

  const recovered = recoverTruncatedObject(trimmed);
  if (recovered) return recovered;

  throw new Error(`The model returned invalid JSON: ${trimmed.slice(0, 200)}`);
};

const getGeminiApiKey = () => {
  const key = (resumeAiConfig.apiKey || (window.GEMINI_CONFIG && window.GEMINI_CONFIG.apiKey) || '').trim();
  if (!key || key.includes('YOUR_GEMINI_API_KEY')) {
    return '';
  }
  return key;
};

const runGeminiPrompt = async ({ model, system, prompt, outputTokens = 2048 }) => {
  const targetModel = model || resumeAiConfig.model || 'gemini-3.8-flash';
  const localApiKey = getGeminiApiKey();

  // If local API key is provided (e.g. from gemini-config.js in local development), call Gemini directly
  if (localApiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(localApiKey)}`;
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const payload = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: outputTokens,
        responseMimeType: 'application/json'
      }
    };
    if (system) {
      payload.systemInstruction = { parts: [{ text: system }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `Gemini API returned ${response.status}`;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError.error && parsedError.error.message) {
          message = `Gemini error (${response.status}): ${parsedError.error.message}`;
        }
      } catch (_) {}
      throw new Error(message);
    }

    const result = await response.json();
    const candidate = result.candidates && result.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const rawText = (part && part.text) || '';
    return parseAiJson(rawText);
  }

  // Otherwise, use the secure Supabase Edge Function (works on live GitHub Pages without exposing keys)
  if (supabaseClient && currentSession) {
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
      body: { model: targetModel, system, prompt, outputTokens }
    });

    if (error) {
      let detail = '';
      if (error.context) {
        try {
          if (typeof error.context.json === 'function') {
            const errBody = await error.context.json();
            detail = errBody && errBody.error
              ? (typeof errBody.error === 'string' ? errBody.error : (errBody.error.message || JSON.stringify(errBody.error)))
              : JSON.stringify(errBody);
          } else if (typeof error.context.text === 'function') {
            detail = await error.context.text();
          }
        } catch (_) {}
      }
      throw new Error(`Edge Function error: ${detail || error.message || error}`);
    }
    if (data && data.error) {
      const msg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
      throw new Error(`Gemini proxy error: ${msg}`);
    }

    const candidate = data && data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const rawText = (part && part.text) || '';
    return parseAiJson(rawText);
  }

  throw new Error('Gemini is not configured. Either supply an API key in gemini-config.js or sign in with your authorized GitHub account to use the secure Edge Function.');
};

const setButtonBusyState = (button, label, message) => {
  if (!button) return;
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent.trim();
  }
  button.disabled = true;
  if (label) button.textContent = label;
  if (message) {
    showSummaryMessage(message);
  }
};

const clearButtonBusyState = (button) => {
  if (!button) return;
  button.disabled = false;
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
};

const showSummaryMessage = (message) => {
  summaryMessage.hidden = false;
  summaryMessage.classList.remove('is-idle');
  summaryMessage.classList.add('is-busy');
  summaryMessage.innerHTML = '<span class="ai-status-spinner" aria-hidden="true"></span><span>' + message + '</span>';
};

const selectedProjects = () => experiences
  .filter((experience) => experience.source_repo && experience.include_in_resume !== false)
  .map((project) => ({
    id: project.id,
    name: project.role,
    description: project.description,
    bullets: (project.resume_bullets || []).slice(0, 5),
    technologies: project.technologies || []
  }));

const updateSummarySourceCount = () => {
  const count = experiences.filter((experience) => experience.include_in_resume !== false).length;
  summarySourceCount.textContent = `${count} work experience ${count === 1 ? 'entry' : 'entries'} will be included.`;
};

const resumeDraftExperiences = () => experiences
  .filter((experience) => experience.include_in_resume !== false)
  .map((experience) => ({
    id: experience.id,
    company: experience.company,
    role: experience.role,
    location: experience.location,
    start_date: experience.start_date,
    end_date: experience.end_date,
    description: experience.description,
    highlights: (experience.highlights || []).slice(0, 10),
    technologies: (experience.technologies || []).slice(0, 10),
    lessons_learned: (experience.lessons_learned || []).slice(0, 10),
    source_repo: experience.source_repo
  }));
const renderResumeDraftRoles = () => {
  resumeDraftRoles.replaceChildren();
  generatedExperienceBullets.forEach(({ id, company, role, bullets }) => {
    const section = document.createElement('section');
    section.className = 'resume-draft-role';
    const heading = document.createElement('h3');
    heading.textContent = `${role} / ${company}`;
    const list = document.createElement('ul');
    bullets.forEach((bullet) => {
      const item = document.createElement('li');
      item.textContent = bullet;
      list.append(item);
    });
    section.append(heading, list);
    resumeDraftRoles.append(section);
  });
};

const generateFullResumeDraft = async () => {
  const workExperience = resumeDraftExperiences();
  if (!workExperience.length) { showSummaryMessage('Add at least one work experience entry to generate a resume.'); return; }
  const jobListingText = targetJobListing ? targetJobListing.value.trim() : '';
  const originalButtonText = generateResume.textContent.trim();
  const step1Text = jobListingText
    ? 'Step 1/3: tailoring and cleaning work experience against target job listing...'
    : 'Step 1/3: cleaning your work experience into resume-ready bullets...';
  setButtonBusyState(generateResume, 'Generating...', step1Text);
  saveSummary.hidden = true;
  summaryReviewLabel.hidden = true;
  resumeDraftReview.hidden = true;
  try {
    const cleanerModel = resumeAiConfig.cleanerModel || resumeAiConfig.model;
    const builderModel = resumeAiConfig.builderModel || resumeAiConfig.model;
    const reviewerModel = resumeAiConfig.reviewerModel || resumeAiConfig.model;

    const cleanedPayload = {
      experience: workExperience.map((experience) => ({
        id: experience.id,
        company: experience.company,
        title: experience.role,
        location: experience.location || '',
        start_date: experience.start_date || '',
        end_date: experience.end_date || 'Present',
        description: (experience.description || '').slice(0, 300),
        highlights: (experience.highlights || []).slice(0, 5).map((highlight) => highlight.slice(0, 200))
      })),
      target_job_listing: jobListingText || null
    };

    showSummaryMessage(step1Text);
    const cleanerSystem = jobListingText
      ? 'You are Agent 1: a resume cleanup and job-matching specialist. Convert raw work experience entries into polished, ATS-friendly resume content for a software engineer, highlighting keywords, competencies, and achievements matching the supplied target job listing. Never invent unsupplied facts. Preserve each entry id exactly. Output valid JSON only.'
      : 'You are Agent 1: a resume cleanup specialist. Convert raw work experience entries into polished, ATS-friendly resume content for a software engineer. Preserve each entry id exactly. Output valid JSON only.';

    const cleanerPrompt = jobListingText
      ? `Normalize this work experience into resume-ready bullet points tailored to the target job listing. Prioritize matching technical skills, impacts, and technologies mentioned in the job description without inventing metrics or claims. Preserve every entry id exactly. Return JSON only in this exact shape: {"experience":[{"id":"entry id","company":"...","title":"...","location":"...","start_date":"...","end_date":"...","bullet_points":["bullet 1"]}]}. Input facts & job listing:\n${JSON.stringify(cleanedPayload)}`
      : `Normalize this work experience into resume-ready bullet points. Preserve every entry id exactly. Return JSON only in this exact shape: {"experience":[{"id":"entry id","company":"...","title":"...","location":"...","start_date":"...","end_date":"...","bullet_points":["bullet 1"]}]}. Work experience facts:\n${JSON.stringify(cleanedPayload)}`;

    const cleanerResult = await runGeminiPrompt({
      model: cleanerModel,
      system: cleanerSystem,
      prompt: cleanerPrompt
    });

    const cleanedExperience = Array.isArray(cleanerResult.experience) ? cleanerResult.experience : [];
    const cleanedById = new Map(cleanedExperience.map((entry) => [String(entry.id), entry]));

    const step2Text = jobListingText
      ? 'Step 2/3: crafting a job-targeted resume summary and experience bullets...'
      : 'Step 2/3: building the software engineer resume draft...';
    showSummaryMessage(step2Text);

    const builderSystem = jobListingText
      ? 'You are Agent 2: a senior software engineer resume writer specializing in ATS job alignment. Build a targeted summary and bullet points directly addressing the requirements and responsibilities of the target job listing. Output valid JSON only.'
      : 'You are Agent 2: a senior software engineer resume writer. Build a polished, ATS-friendly resume from cleaned experience data. Output valid JSON only.';

    const builderPrompt = jobListingText
      ? `Create a tailored software engineer resume draft matching the job listing below. Write a compelling 2-3 sentence summary specifically positioning the candidate for this target role. Return exactly 3-4 impactful bullets per experience entry that align with the role's priorities. Return JSON only in this exact shape: {"summary":"...","experience":[{"id":"entry id","company":"...","title":"...","location":"...","start_date":"...","end_date":"...","bullet_points":["bullet 1","bullet 2","bullet 3"]}]}. Job listing & entries:\n${JSON.stringify({ target_job_listing: jobListingText.slice(0, 1500), normalized_entries: cleanedExperience })}`
      : `Create a concise software engineer resume using the normalized entries below. Preserve every entry id exactly. Return exactly 3 bullets per entry. Return JSON only in this exact shape: {"summary":"...","experience":[{"id":"entry id","company":"...","title":"...","location":"...","start_date":"...","end_date":"...","bullet_points":["bullet 1","bullet 2","bullet 3"]}]}. Normalized entries:\n${JSON.stringify(cleanedExperience)}`;

    const builderResult = await runGeminiPrompt({
      model: builderModel,
      outputTokens: resumeAiConfig.builderOutputTokens,
      system: builderSystem,
      prompt: builderPrompt
    });

    const summary = typeof builderResult.summary === 'string' ? builderResult.summary.trim() : '';
    const builderExperience = Array.isArray(builderResult.experience) ? builderResult.experience : [];
    generatedExperienceBullets = workExperience.map((experience) => {
      const draft = builderExperience.find((item) => String(item.id || '') === String(experience.id)) || builderExperience.find((item) => item.company === experience.company && item.title === experience.role);
      const draftBullets = Array.isArray(draft && draft.bullet_points) ? draft.bullet_points : [];
      const bullets = draftBullets.filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5);
      if (!bullets.length) {
        const cleanedEntry = cleanedById.get(String(experience.id)) || cleanedExperience.find((item) => item.company === experience.company && item.title === experience.role);
        const cleanedBulletsArray = Array.isArray(cleanedEntry && cleanedEntry.bullet_points) ? cleanedEntry.bullet_points : [];
        const cleanedBullets = cleanedBulletsArray.filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5);
        if (cleanedBullets.length) return { id: experience.id, company: experience.company, role: experience.role, bullets: cleanedBullets };
        throw new Error(`The model returned no bullets for ${experience.role}. Add more highlights and try again.`);
      }
      return { id: experience.id, company: experience.company, role: experience.role, bullets };
    });

    if (!summary || summary.length > 700) throw new Error('The model returned an unusable summary.');

    showSummaryMessage('Step 3/3: reviewing the draft like a top-tech recruiter...');
    const reviewerPrompt = jobListingText
      ? `Review this tailored resume as a software recruiter evaluating fit for the target job listing. Keep each list to 2 items maximum. Return JSON only in this exact shape: {"overall_score":0,"strengths":["..."],"gaps":["..."],"ats_issues":["..."],"improvement_suggestions":["..."],"likely_screening_outcome":"..."}. Target job:\n${jobListingText.slice(0, 800)}\n\nResume:\n${JSON.stringify({ summary, experience: builderExperience.map((entry) => ({ ...entry, bullet_points: (entry.bullet_points || []).slice(0, 3).map((bullet) => bullet.slice(0, 240)) })) })}`
      : `Review this resume as a software recruiter. Keep each list to 2 items maximum. Return JSON only in this exact shape: {"overall_score":0,"strengths":["..."],"gaps":["..."],"ats_issues":["..."],"improvement_suggestions":["..."],"likely_screening_outcome":"..."}. Resume:\n${JSON.stringify({ summary, experience: builderExperience.map((entry) => ({ ...entry, bullet_points: (entry.bullet_points || []).slice(0, 3).map((bullet) => bullet.slice(0, 240)) })) })}`;

    const reviewResult = await runGeminiPrompt({
      model: reviewerModel,
      system: 'You are Agent 3: a senior technical recruiter for a top software company. Review the resume for clarity, technical relevance, job alignment, and hiring signal. Return valid JSON only.',
      prompt: reviewerPrompt
    });

    console.info('Recruiter review:', reviewResult);
    generatedProjectBullets = generatedExperienceBullets.filter(({ id }) => {
      const item = workExperience.find((experience) => experience.id === id);
      return Boolean(item && item.source_repo);
    });
    summaryReview.value = summary;
    summaryReviewLabel.hidden = false;
    resumeDraftReview.hidden = false;
    renderResumeDraftRoles();
    saveSummary.hidden = false;
    publishResume.hidden = false;
    const reviewSummary = Number.isFinite(Number(reviewResult.overall_score))
      ? ` Resume match score: ${reviewResult.overall_score}/100.`
      : '';
    const outcomeText = reviewResult.likely_screening_outcome ? ` (Screening: ${reviewResult.likely_screening_outcome})` : '';
    showSummaryMessage(`Resume draft generated and reviewed against the job criteria.${reviewSummary}${outcomeText} Review the tailored summary and bullets before saving or publishing.`);
    localStorage.setItem('resumePreview', JSON.stringify({ summary, experiences: generatedExperienceBullets, projects: generatedProjectBullets }));
    window.open(`resume.html?preview=${Date.now()}`, '_blank', 'noopener');
  } catch (error) {
    console.error('Gemini full resume generation failed:', error);
    showSummaryMessage(`Gemini could not generate the resume. ${error.message}`);
  } finally {
    clearButtonBusyState(generateResume);
    if (generateResume.dataset.originalText) {
      generateResume.textContent = generateResume.dataset.originalText;
      delete generateResume.dataset.originalText;
    }
    generateResume.disabled = false;
  }
};

const generateSummaryDraft = async (openPreview = false) => {
  const projects = selectedProjects();
  if (!projects.length) { showSummaryMessage('Select at least one GitHub project for the summary.'); return; }
  generateSummary.disabled = true;
  saveSummary.hidden = true;
  summaryReviewLabel.hidden = true;
  showSummaryMessage('Connecting to Gemini model...');
  try {
    const generated = await runGeminiPrompt({
      model: resumeAiConfig.model,
      system: 'You are an expert resume writer. Create concise, professional profile summaries and resume bullets. Return valid JSON only.',
      prompt: `Create a resume draft using only the supplied project facts. Write a concise professional profile summary in 2-3 sentences. For every project, rewrite its supplied bullets into 3-5 distinct concise resume bullets, with each bullet focusing on a different supplied fact. Do not invent metrics, employers, job titles, dates, technologies, users, or outcomes. Return JSON only in this exact shape: {"summary":"...","projects":[{"id":"project id","bullets":["bullet 1"]}]}. Include every project exactly once, preserve each project id, and return between 3 and 5 bullets per project. Project facts:\n${JSON.stringify(projects)}`
    });
    const draft = generated.summary ? generated.summary.trim() : '';
    generatedProjectBullets = projects.map((project) => {
      const generatedProject = generated.projects && generated.projects.find((item) => item.id === project.id);
      const bullets = ((generatedProject && generatedProject.bullets) || []).filter((bullet) => typeof bullet === 'string' && bullet.trim()).slice(0, 5);
      if (!bullets.length) throw new Error(`The model returned no bullets for ${project.name}.`);
      return { id: project.id, bullets };
    });
    if (!draft || draft.length > 700) throw new Error('The model returned an unusable summary.');
    summaryReview.value = draft;
    summaryReviewLabel.hidden = false;
    saveSummary.hidden = false;
    publishResume.hidden = false;
    showSummaryMessage('Draft generated. Review every claim before saving.');
    if (openPreview) {
      localStorage.setItem('resumePreview', JSON.stringify({ summary: draft, projects: generatedProjectBullets }));
      const previewUrl = `resume.html?preview=${Date.now()}`;
      window.open(previewUrl, '_blank', 'noopener');
    }
  } catch (error) {
    console.error('Gemini summary generation failed:', error);
    showSummaryMessage(`Gemini could not generate a draft. ${error.message}`);
  } finally {
    generateSummary.disabled = false;
  }
};

const saveApprovedSummary = async (publish = false) => {
  const summary = summaryReview.value.trim();
  if (!summary || summary.length > 700) { showSummaryMessage('Enter a summary between 1 and 700 characters.'); return; }
  const activeButton = publish ? publishResume : saveSummary;
  activeButton.disabled = true;
  saveSummary.disabled = true;
  const { error } = await supabaseClient.from('resume_profile').upsert({ id: 1, summary, updated_by: currentSession.user.id, updated_at: new Date().toISOString() });
  if (error) {
    showSummaryMessage('The approved summary could not be saved. Run the Supabase schema first.');
  } else {
    const approvedBulletUpdates = generatedExperienceBullets.length ? generatedExperienceBullets : generatedProjectBullets;
    const projectUpdates = approvedBulletUpdates.map(({ id, bullets }) => (
      supabaseClient.from('work_experience').update({ resume_bullets: bullets }).eq('id', id)
    ));
    const results = await Promise.all(projectUpdates);
    if (results.some((result) => result.error)) showSummaryMessage('Resume summary saved, but some experience bullets could not be updated.');
    else showSummaryMessage(publish ? 'Generated resume published to the live resume page.' : 'Approved summary and experience bullets saved to your resume.');
  }
  activeButton.disabled = false;
  saveSummary.disabled = false;
};

const getResumeBullets = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const getOriginalBulletsFromForm = () => getResumeBullets(new FormData(experienceForm).get('highlights') || '');

const renderBulletList = (target, bullets) => {
  target.replaceChildren();
  bullets.forEach((bullet) => {
    const item = document.createElement('li');
    item.textContent = bullet;
    target.append(item);
  });
};

const showExperienceMessage = (message) => {
  experienceMessage.hidden = false;
  experienceMessage.classList.remove('is-idle');
  experienceMessage.classList.add('is-busy');
  experienceMessage.innerHTML = '<span class="ai-status-spinner" aria-hidden="true"></span><span>' + message + '</span>';
};

const getDescriptionFactsFromForm = () => {
  const formData = new FormData(experienceForm);
  return {
    company: formData.get('company').trim(),
    role: formData.get('role').trim(),
    location: formData.get('location').trim(),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date') || 'Present',
    description: formData.get('description').trim(),
    highlights: getResumeBullets(formData.get('highlights')),
    technologies: formData.get('technologies').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 10),
    lessons_learned: getResumeBullets(formData.get('lessons_learned')).slice(0, 10)
  };
};

const generateExperienceDraft = async () => {
  const facts = getDescriptionFactsFromForm();
  if (!facts.company || !facts.role || !facts.highlights.length) {
    showExperienceMessage('Add a company, role, and at least one highlight first.');
    return;
  }
  experienceReview.hidden = true;
  originalExperienceDescription = facts.description;
  originalResumeBullets = facts.highlights;
  showExperienceMessage('Synthesizing experience into resume-ready format with Gemini...');
  try {
    const cleanerModel = resumeAiConfig.cleanerModel || resumeAiConfig.model;
    const cleanerResult = await runGeminiPrompt({
      model: cleanerModel,
      system: 'You are an expert technical resume writer and career strategist specializing in software engineering. Your objective is to synthesize raw work experiences, highlights, notes, and technologies into high-impact, ATS-optimized resume content. Elevate bullets using strong action verbs, technical scope, and measurable outcomes (following the Google XYZ formula: accomplished [X], as measured by [Y], by doing [Z]). Synthesize or group related points into 3-5 punchy, substantive bullets (1-2 sentences each). Avoid generic filler, and output valid JSON only.',
      prompt: `Synthesize this software engineering experience into a polished 1-2 sentence role overview description and 3-5 high-impact, ATS-friendly resume bullets.

Guidelines:
- Lead each bullet with a powerful action verb (e.g. Architected, Engineered, Scaled, Streamlined, Spearheaded, Implemented).
- Frame achievements with clear context: what was built, what technologies/methodologies were used, and the engineering impact, scale, or outcome.
- Synthesize, elevate, or consolidate raw highlights and notes into the strongest 3 to 5 cohesive bullets (do not feel forced to preserve a 1:1 mapping of messy notes).
- Naturally integrate relevant technologies from the provided tech stack into the bullets.
- Keep each bullet punchy, impactful, and professional (1-2 sentences).
- Do not invent fictitious companies, employment dates, or ungrounded statistics.

Return JSON only in this exact schema:
{"description":"concise 1-2 sentence overview of the role and scope","bullet_points":["impact bullet 1","impact bullet 2"]}

Work experience facts:
${JSON.stringify(facts)}`
    });

    const cleanedDescription = typeof cleanerResult.description === 'string' ? cleanerResult.description.trim() : facts.description;
    const cleanedBullets = Array.isArray(cleanerResult.bullet_points)
      ? cleanerResult.bullet_points.filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5)
      : [];
    if (!cleanedBullets.length) {
      throw new Error('The model returned no usable resume bullets. Add more details and try again.');
    }
    generatedExperienceDescription = cleanedDescription;
    generatedResumeBullets = cleanedBullets;
    const removedIndexes = [];
    if (!generatedExperienceDescription || generatedExperienceDescription.length > 1000 || !generatedResumeBullets.length) throw new Error('The model returned no usable resume bullets.');
    originalDescription.textContent = originalExperienceDescription || 'No original description entered.';
    renderBulletList(originalHighlights, originalResumeBullets);
    removedHighlights.replaceChildren();
    removedIndexes.forEach((index) => {
      const entry = document.createElement('li');
      entry.textContent = cleanedBullets[index] || facts.highlights[index];
      removedHighlights.append(entry);
    });
    removedHighlightsReview.hidden = !removedIndexes.length;
    generatedDescription.textContent = generatedExperienceDescription;
    renderBulletList(generatedBullets, generatedResumeBullets);
    const reason = 'Synthesized experience into high-impact, ATS-optimized resume bullets following Google XYZ impact formatting.';
    changeReason.textContent = `Why these changes: ${reason}`;
    experienceReview.hidden = false;
    showExperienceMessage('Draft generated. Approve the generated description or bullets, then save the role.');
  } catch (error) {
    console.error('Gemini experience draft generation failed:', error);
    showExperienceMessage(`Gemini could not generate a resume draft. ${error.message}`);
  } finally {
  }
};

const validateResumeBullets = (bullets) => {
  if (bullets.length > 5) return 'Use no more than 5 resume bullets per project.';
  const invalidBullet = bullets.find((bullet) => (bullet.match(/[.!?]+(?=\s|$)/g) || []).length > 2);
  return invalidBullet ? 'Each resume bullet must be 1-2 sentences.' : null;
};

/* Bullet repeater management */
const syncHighlightsTextarea = () => {
  if (!bulletsContainer || !experienceForm.elements.highlights) return;
  const bulletInputs = Array.from(bulletsContainer.querySelectorAll('.bullet-input'));
  const values = bulletInputs.map((input) => input.value.trim()).filter(Boolean);
  experienceForm.elements.highlights.value = values.join('\n');
};

const updateBulletNumbers = () => {
  if (!bulletsContainer) return;
  const rows = bulletsContainer.querySelectorAll('.bullet-repeater-row');
  rows.forEach((row, index) => {
    const num = row.querySelector('.bullet-number');
    if (num) num.textContent = `${index + 1}.`;
  });
};

const createBulletRow = (value = '') => {
  const row = document.createElement('div');
  row.className = 'bullet-repeater-row';

  const num = document.createElement('span');
  num.className = 'bullet-number';

  const input = document.createElement('textarea');
  input.className = 'bullet-input';
  input.rows = 2;
  input.placeholder = 'e.g. Scaled distributed service to 10M+ daily requests with 99.99% uptime...';
  input.value = value;
  input.addEventListener('input', syncHighlightsTextarea);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'bullet-delete-btn';
  deleteBtn.type = 'button';
  deleteBtn.setAttribute('aria-label', 'Remove bullet');
  deleteBtn.innerHTML = '&times;';
  deleteBtn.addEventListener('click', () => {
    row.remove();
    updateBulletNumbers();
    syncHighlightsTextarea();
    if (!bulletsContainer.children.length) createBulletRow('');
  });

  row.append(num, input, deleteBtn);
  bulletsContainer.append(row);
  updateBulletNumbers();
  syncHighlightsTextarea();
  return row;
};

const populateBulletsRepeater = (bullets = []) => {
  if (!bulletsContainer) return;
  bulletsContainer.replaceChildren();
  if (bullets.length) {
    bullets.forEach((bullet) => createBulletRow(bullet));
  } else {
    createBulletRow('');
  }
};

let drawerCloseTimeout = null;

/* Drawer open / close handlers */
const openDrawer = (isEditing = false) => {
  if (!experienceDrawer) return;
  if (drawerCloseTimeout) {
    clearTimeout(drawerCloseTimeout);
    drawerCloseTimeout = null;
  }
  drawerBackdrop.hidden = false;
  experienceDrawer.hidden = false;
  requestAnimationFrame(() => {
    drawerBackdrop.classList.add('is-open');
    experienceDrawer.classList.add('is-open');
  });
  drawerTitle.textContent = isEditing ? 'Edit experience' : 'Add experience';
  document.body.style.overflow = 'hidden';
};

const closeDrawer = () => {
  if (!experienceDrawer) return;
  if (drawerCloseTimeout) {
    clearTimeout(drawerCloseTimeout);
    drawerCloseTimeout = null;
  }
  drawerBackdrop.classList.remove('is-open');
  experienceDrawer.classList.remove('is-open');
  drawerCloseTimeout = setTimeout(() => {
    drawerBackdrop.hidden = true;
    experienceDrawer.hidden = true;
    document.body.style.overflow = '';
    drawerCloseTimeout = null;
  }, 280);
};

const resetForm = (shouldCloseDrawer = true) => {
  editingExperience = null;
  experienceForm.reset();
  experienceForm.elements.sort_order.value = '0';
  formHeading.textContent = 'New role';
  if (drawerTitle) drawerTitle.textContent = 'Add experience';
  formMessage.hidden = true;
  experienceGenerator.hidden = true;
  experienceReview.hidden = true;
  generatedResumeBullets = [];
  originalResumeBullets = [];
  originalExperienceDescription = '';
  generatedExperienceDescription = '';
  experienceMessage.hidden = true;
  if (isCurrentRoleCheckbox) isCurrentRoleCheckbox.checked = false;
  if (experienceForm.elements.end_date) experienceForm.elements.end_date.disabled = false;
  populateBulletsRepeater([]);
  if (shouldCloseDrawer) {
    closeDrawer();
  }
};

const formatDate = (value) => {
  if (!value) return 'Present';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const renderExperiences = () => {
  experienceCount.textContent = `${experiences.length} ${experiences.length === 1 ? 'entry' : 'entries'}`;
  updateSummarySourceCount();
  experienceList.replaceChildren();
  if (!experiences.length) {
    const empty = document.createElement('p');
    empty.className = 'project-status';
    empty.textContent = 'No roles saved yet.';
    experienceList.append(empty);
    return;
  }
  experiences.forEach((experience) => {
    const article = document.createElement('article');
    article.className = 'experience-entry';
    const heading = document.createElement('div');
    heading.className = 'experience-entry-heading';
    const role = document.createElement('h2');
    role.textContent = experience.role;
    const company = document.createElement('p');
    company.className = 'experience-company';
    company.textContent = [experience.company, experience.location].filter(Boolean).join(' / ');
    heading.append(role, company);
    const dates = document.createElement('p');
    dates.className = 'experience-dates';
    dates.textContent = `${formatDate(experience.start_date)} - ${formatDate(experience.end_date)}`;
    article.append(heading, dates);
    if (experience.description) {
      const description = document.createElement('p');
      description.textContent = experience.description;
      article.append(description);
    }
    const displayHighlights = experience.source_repo && experience.resume_bullets && experience.resume_bullets.length
      ? experience.resume_bullets
      : experience.highlights;
    if (displayHighlights && displayHighlights.length) {
      const list = document.createElement('ul');
      displayHighlights.forEach((highlight) => {
        const item = document.createElement('li');
        item.textContent = highlight;
        list.append(item);
      });
      article.append(list);
    }
    if (experience.lessons_learned && experience.lessons_learned.length) {
      const lessons = document.createElement('p');
      lessons.textContent = `Learned: ${experience.lessons_learned.join(' | ')}`;
      article.append(lessons);
    }
    if (experience.technologies && experience.technologies.length) {
      const tags = document.createElement('div');
      tags.className = 'project-tags';
      experience.technologies.forEach((technology) => {
        const tag = document.createElement('span');
        tag.textContent = technology;
        tags.append(tag);
      });
      article.append(tags);
    }
    if (experience.source_repo) {
      const resumeNote = document.createElement('p');
      resumeNote.className = 'experience-resume-note';
      const bulletCount = (experience.resume_bullets && experience.resume_bullets.length) || (experience.highlights && experience.highlights.length) || 0;
      resumeNote.textContent = experience.include_in_resume === false
        ? 'Excluded from generated resume.'
        : `${bulletCount} resume bullet${bulletCount === 1 ? '' : 's'} selected.`;
      article.append(resumeNote);
    }
    if (experience.source_repo) {
      const source = document.createElement('a');
      source.className = 'text-link';
      source.href = experience.source_repo;
      source.target = '_blank';
      source.rel = 'noreferrer';
      source.textContent = 'View repository ↗';
      article.append(source);
      const updates = document.createElement('a');
      updates.className = 'text-link project-blog-link';
      updates.href = `blog.html?repo=${encodeURIComponent(experience.source_repo.replace('https://github.com/', ''))}`;
      updates.textContent = 'View project updates →';
      article.append(updates);
    }
    const actions = document.createElement('div');
    actions.className = 'update-actions';
    if (isAllowedEditor) {
      ['Edit', 'Delete'].forEach((label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => {
          if (label === 'Edit') beginEdit(experience);
          else if (label === 'Delete') deleteExperience(experience.id);
        });
        actions.append(button);
      });
    }
    article.append(actions);
    experienceList.append(article);
  });
};

const loadExperiences = async () => {
  const { data, error } = await supabaseClient.from('work_experience').select('*').order('sort_order').order('start_date', { ascending: false });
  if (error) throw error;
  experiences = data || [];
  renderExperiences();
};

const beginEdit = (experience, showAiReview = false) => {
  editingExperience = experience;
  generatedResumeBullets = [];
  generatedExperienceDescription = '';
  originalExperienceDescription = experience.description || '';
  const originalResumeLength = experience.original_resume_bullets && experience.original_resume_bullets.length;
  originalResumeBullets = originalResumeLength
    ? experience.original_resume_bullets
    : (experience.highlights && experience.highlights.length ? experience.highlights : (experience.resume_bullets || []));
  Object.entries(experience).forEach(([key, value]) => {
    if (!experienceForm.elements[key]) return;
    experienceForm.elements[key].value = Array.isArray(value)
      ? (key === 'highlights' ? value.join('\n') : value.join(', '))
      : (key.endsWith('_date') && value ? value.slice(0, 7) : value || '');
  });
  const bulletList = Array.isArray(experience.highlights)
    ? experience.highlights
    : (typeof experience.highlights === 'string' ? experience.highlights.split('\n').filter(Boolean) : []);
  populateBulletsRepeater(bulletList);
  if (isCurrentRoleCheckbox) {
    const isCurrent = !experience.end_date;
    isCurrentRoleCheckbox.checked = isCurrent;
    if (experienceForm.elements.end_date) {
      experienceForm.elements.end_date.disabled = isCurrent;
      if (isCurrent) experienceForm.elements.end_date.value = '';
    }
  }
  experienceForm.elements.include_in_resume.checked = experience.include_in_resume !== false;
  experienceGenerator.hidden = !showAiReview;
  experienceReview.hidden = true;
  formHeading.textContent = 'Edit role';
  openDrawer(true);
};

const isDemoMode = new URLSearchParams(window.location.search).has('demo');

const deleteExperience = async (id) => {
  if (!window.confirm('Delete this role?')) return;
  if (isDemoMode && (!supabaseClient || !currentSession)) {
    experiences = experiences.filter((experience) => experience.id !== id);
    renderExperiences();
    return;
  }
  const { error } = await supabaseClient.from('work_experience').delete().eq('id', id);
  if (error) { showMessage('This role could not be deleted.'); return; }
  await loadExperiences();
};

const syncExperienceEntries = async (entries, matchesEntry) => {
  let inserted = 0;
  let updated = 0;
  let removed = 0;
  for (const entry of entries) {
    const matches = experiences.filter((experience) => matchesEntry(experience, entry));
    if (matches.length) {
      const { error } = await supabaseClient.from('work_experience').update(entry).eq('id', matches[0].id);
      if (error) throw error;
      updated += 1;
      for (const duplicate of matches.slice(1)) {
        const { error: deleteError } = await supabaseClient.from('work_experience').delete().eq('id', duplicate.id);
        if (deleteError) throw deleteError;
        removed += 1;
      }
    } else {
      const { error } = await supabaseClient.from('work_experience').insert(entry);
      if (error) throw error;
      inserted += 1;
    }
  }
  return { inserted, updated, removed };
};

const importResumeEntries = async () => {
  importResume.disabled = true;
  try {
    const result = await syncExperienceEntries(resumeExperiences, (experience, entry) => (
      experience.company.toLowerCase().includes(entry.company.toLowerCase().split(' ')[0])
      || entry.company.toLowerCase().includes(experience.company.toLowerCase().split(' ')[0])
    ));
    await loadExperiences();
    showMessage(`Resume synced: ${result.inserted} added, ${result.updated} updated, ${result.removed} duplicate${result.removed === 1 ? '' : 's'} removed.`);
  } catch (error) {
    showMessage('Resume entries could not be synced.');
  } finally {
    importResume.disabled = false;
  }
};

const getProjectUpdates = async () => {
  const { data, error } = await supabaseClient.from('project_updates').select('repo_full_name, title, body').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const getRepositoryPrefix = (fullName) => {
  const separatorIndex = fullName.lastIndexOf('/');
  const owner = fullName.slice(0, separatorIndex);
  const repository = fullName.slice(separatorIndex + 1).split('_', 1)[0];
  return `${owner}/${repository}`;
};

const getRepositoryActivity = async (repo) => {
  const [commitsResponse, pullRequestsResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=10`),
    fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=10`)
  ]);
  const commits = commitsResponse.ok ? await commitsResponse.json() : [];
  const pullRequests = pullRequestsResponse.ok ? await pullRequestsResponse.json() : [];
  return {
    commits: commits.map((commit) => {
      const message = commit && commit.commit && commit.commit.message ? commit.commit.message.split('\n')[0].slice(0, 240) : '';
      return message;
    }).filter(Boolean),
    pullRequests: pullRequests.map((pullRequest) => ({
      title: pullRequest.title,
      body: pullRequest.body ? pullRequest.body.trim().slice(0, 240) : ''
    })).filter((pullRequest) => pullRequest.title)
  };
};

const synthesizeProject = (repo, groupedRepos, updates, activity) => {
  const repositoryPrefix = getRepositoryPrefix(repo.full_name);
  const repoUpdates = updates.filter((update) => update.repo_full_name === repositoryPrefix || update.repo_full_name.startsWith(`${repositoryPrefix}_`));
  const updateText = repoUpdates.map((update) => `${update.title}${update.body ? `: ${update.body}` : ''}`).join(' ');
  const commitHighlights = activity.commits.slice(0, 5).map((message) => `Commit: ${message}`);
  const pullRequestHighlights = activity.pullRequests.slice(0, 5).map((pullRequest) => `PR: ${pullRequest.title}${pullRequest.body ? ` - ${pullRequest.body}` : ''}`);
  const description = repo.description || `Built and maintained ${repositoryPrefix.split('/').pop()} as an independent software project.`;
  const updateHighlights = repoUpdates.slice(0, 5).map((update) => `Journal: ${update.title}${update.body ? ` - ${update.body}` : ''}`);
  const repositoryHighlights = groupedRepos.length > 1
    ? [`Related repositories: ${groupedRepos.map((item) => item.name).join(', ')}`]
    : [];
  const highlights = [...repositoryHighlights, ...updateHighlights, ...pullRequestHighlights, ...commitHighlights].slice(0, 10);
  const lessons = [
    repoUpdates.length ? `Documented project decisions and progress through ${repoUpdates.length} project journal ${repoUpdates.length === 1 ? 'entry' : 'entries'}.` : null,
    activity.pullRequests.length ? `Practiced breaking work into ${activity.pullRequests.length} pull request ${activity.pullRequests.length === 1 ? 'review' : 'reviews'}.` : null,
    activity.commits.length ? `Built iteratively through ${activity.commits.length} recent commits, using version control to refine the project.` : null,
    updateText.slice(0, 240)
  ].filter(Boolean).slice(0, 4);
  return {
    company: 'GitHub project',
    role: repositoryPrefix.split('/').pop().replace(/[-_]/g, ' '),
    location: null,
    start_date: `${new Date(repo.created_at || repo.pushed_at).toISOString().slice(0, 7)}-01`,
    end_date: null,
    description,
    highlights: highlights.length ? highlights : [description],
    lessons_learned: lessons.length ? lessons : ['Practiced taking a software project from idea to a working implementation.'],
    resume_bullets: highlights.slice(0, 5),
    technologies: [...new Set(groupedRepos.flatMap((item) => [item.language, ...(item.topics || [])]).filter(Boolean))].slice(0, 8),
    source_repo: `https://github.com/${repositoryPrefix}`,
    sort_order: 100
  };
};

const formatProjectWithAgent = async (project) => {
  const projectFacts = {
    project_id: project.source_repo,
    repository: project.role,
    related_repositories: project.highlights.filter((highlight) => highlight.startsWith('Related repositories:')).slice(0, 1),
    description: project.description.slice(0, 500),
    activity: project.highlights.filter((highlight) => !highlight.startsWith('Related repositories:')).map((highlight) => highlight.slice(0, 300)).slice(0, 10),
    lessons_learned: project.lessons_learned.map((lesson) => lesson.slice(0, 300)).slice(0, 4),
    technologies: project.technologies,
    start_date: project.start_date,
    end_date: project.end_date
  };
  try {
    const formatterRequest = runGeminiPrompt({
      model: resumeAiConfig.cleanerModel || resumeAiConfig.model,
      outputTokens: 2048,
      system: 'You are an expert technical resume writer. Turn verified software project facts, commits, and PR activity into a concise, ATS-friendly Selected Project entry. Highlight architectural decisions, tech stack, and practical implementation. Keep the entry clearly project-focused. Output valid JSON only.',
      prompt: `Synthesize this software project for a resume. Preserve project_id and repository name exactly. Return 2-4 impactful resume bullets (1-2 sentences each) highlighting system architecture, technologies used, and key features built. Do not invent fictitious employers or metrics. Return JSON only in this exact shape: {"project_id":"...","project_name":"repository name","role":"...","company":"Independent project","location":"...","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD or null","description":"one or two concise sentences","bullet_points":["impact bullet"]}. Project facts:\n${JSON.stringify(projectFacts)}`
    });
    const result = await Promise.race([
      formatterRequest,
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Agent 1 project formatting timed out.')), 45000))
    ]);
    const bullets = Array.isArray(result.bullet_points)
      ? result.bullet_points.filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5)
      : [];
    const startDate = typeof result.start_date === 'string' && /^\d{4}-\d{2}(-\d{2})?$/.test(result.start_date)
      ? (result.start_date.length === 7 ? `${result.start_date}-01` : result.start_date)
      : project.start_date;
    const endDate = typeof result.end_date === 'string' && /^\d{4}-\d{2}(-\d{2})?$/.test(result.end_date)
      ? (result.end_date.length === 7 ? `${result.end_date}-01` : result.end_date)
      : null;
    const context = typeof result.company === 'string' && result.company.trim() ? result.company.trim() : project.company;
    const projectName = project.role;
    if (context.length > 160 || !/(project|github|independent|personal|open source)/i.test(context)) throw new Error('Agent 1 returned an invalid project context.');
    if (result.project_id !== project.source_repo || !bullets.length || !result.role || !result.description) throw new Error('Agent 1 returned an incomplete project entry.');
    return {
      ...project,
      role: projectName,
      company: `${context} / ${projectName}`.slice(0, 160),
      location: project.location,
      start_date: startDate,
      end_date: endDate,
      description: String(result.description).trim().slice(0, 1000),
      resume_bullets: bullets
    };
  } catch (error) {
    console.warn('Agent 1 project formatting unavailable; using source facts.', error);
    return project;
  }
};

const removeUnavailableRepositoryEntries = async (repos) => {
  const publicRepositoryPrefixes = new Set(repos.map((repo) => getRepositoryPrefix(repo.full_name)));
  const unavailableEntries = experiences.filter((experience) => {
    const sourceRepo = experience.source_repo ? experience.source_repo.replace(/\/$/, '') : '';
    const repositoryName = sourceRepo ? sourceRepo.replace('https://github.com/', '') : '';
    return repositoryName.indexOf('BB00GIE/') === 0 && !publicRepositoryPrefixes.has(repositoryName);
  });
  for (const entry of unavailableEntries) {
    const { error } = await supabaseClient.from('work_experience').delete().eq('id', entry.id);
    if (error) throw error;
  }
  return unavailableEntries.length;
};

const synthesizeRepositoryEntries = async () => {
  synthesizeRepos.disabled = true;
  try {
    const [reposResponse, updates] = await Promise.all([
      fetch(`https://api.github.com/users/BB00GIE/repos?sort=updated&per_page=100`),
      getProjectUpdates()
    ]);
    if (!reposResponse.ok) throw new Error(`GitHub returned ${reposResponse.status}`);
    const repos = (await reposResponse.json()).filter((repo) => !repo.fork && !repo.private && repo.visibility === 'public');
    const unavailableCount = await removeUnavailableRepositoryEntries(repos);
    const activity = await Promise.all(repos.map(async (repo) => {
      try { return await getRepositoryActivity(repo); } catch (error) { return { commits: [], pullRequests: [] }; }
    }));
    const repositoryGroups = [...new Map(repos.map((repo) => [getRepositoryPrefix(repo.full_name), []])).entries()];
    repos.forEach((repo) => repositoryGroups.find(([prefix]) => prefix === getRepositoryPrefix(repo.full_name))[1].push(repo));
    const entries = await Promise.all(repositoryGroups.map(async ([prefix, groupedRepos]) => {
      const groupActivities = groupedRepos.map((repo) => activity[repos.indexOf(repo)]);
      const project = synthesizeProject(groupedRepos[0], groupedRepos, updates, {
        commits: groupActivities.flatMap((item) => item.commits),
        pullRequests: groupActivities.flatMap((item) => item.pullRequests)
      });
      return formatProjectWithAgent(project);
    }));
    const result = await syncExperienceEntries(entries, (experience, entry) => {
      const repoA = experience.source_repo ? experience.source_repo.replace('https://github.com/', '') : '';
      const repoB = entry.source_repo ? entry.source_repo.replace('https://github.com/', '') : '';
      return experience.source_repo === entry.source_repo || getRepositoryPrefix(repoA || '') === getRepositoryPrefix(repoB);
    });
    await loadExperiences();
    const removedCount = unavailableCount + result.removed;
    showMessage(`GitHub projects synced: ${result.inserted} added, ${result.updated} updated, ${removedCount} duplicate or unavailable ${removedCount === 1 ? 'entry' : 'entries'} removed.`);
  } catch (error) {
    showMessage('GitHub projects or project updates could not be loaded right now.');
  } finally {
    synthesizeRepos.disabled = false;
  }
};

const updateAuthUi = async (session) => {
  currentSession = session;
  isAllowedEditor = false;
  if (isDemoMode) {
    isAllowedEditor = true;
    accessMessage.hidden = true;
    if (openNewRole) openNewRole.hidden = false;
    if (toggleTools) toggleTools.hidden = false;
    authStatus.textContent = 'Demo mode active (local preview).';
    if (!experiences.length) {
      experiences = [...resumeExperiences];
      renderExperiences();
    }
    return;
  }
  if (!session) {
    authStatus.textContent = supabaseClient ? 'Public experience record. Sign in to manage it.' : 'Supabase is not configured yet.';
    signIn.hidden = !supabaseClient;
    signOut.hidden = true;
    if (openNewRole) openNewRole.hidden = true;
    if (toggleTools) toggleTools.hidden = true;
    if (experienceToolsBar) experienceToolsBar.hidden = true;
    if (summaryGenerator) summaryGenerator.hidden = true;
    closeDrawer();
    if (supabaseClient) {
      try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
    }
    return;
  }
  signIn.hidden = true;
  signOut.hidden = false;
  const username = session.user.user_metadata && session.user.user_metadata.user_name ? session.user.user_metadata.user_name : (session.user.email || 'your account');
  authStatus.textContent = `Signed in as ${username}.`;
  const { data: allowedAuthor, error } = await supabaseClient.from('allowed_authors').select('user_id').eq('user_id', session.user.id).eq('github_username', 'BB00GIE').maybeSingle();
  if (error || !allowedAuthor) {
    if (openNewRole) openNewRole.hidden = true;
    if (toggleTools) toggleTools.hidden = true;
    if (experienceToolsBar) experienceToolsBar.hidden = true;
    if (summaryGenerator) summaryGenerator.hidden = true;
    closeDrawer();
    accessMessage.hidden = false;
    accessMessage.textContent = error ? 'Access could not be checked. Run the Supabase schema first.' : 'You can view this record, but only Brandon can update it.';
    try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
    return;
  }
  isAllowedEditor = true;
  accessMessage.hidden = true;
  if (openNewRole) openNewRole.hidden = false;
  if (toggleTools) toggleTools.hidden = false;
  if (experienceToolsBar) experienceToolsBar.hidden = true; // closed by default to avoid clutter
  if (summaryGenerator) summaryGenerator.hidden = true;
  try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
};

if (signIn) { signIn.addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.href } });
}); }

if (signOut) { signOut.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  updateAuthUi(null);
}); }

if (openNewRole) { openNewRole.addEventListener('click', () => {
  resetForm(false);
  openDrawer(false);
}); }

if (drawerClose) { drawerClose.addEventListener('click', closeDrawer); }
if (drawerBackdrop) { drawerBackdrop.addEventListener('click', closeDrawer); }

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && experienceDrawer && !experienceDrawer.hidden) {
    closeDrawer();
  }
});

if (toggleTools) { toggleTools.addEventListener('click', () => {
  const isCurrentlyHidden = experienceToolsBar.hidden;
  experienceToolsBar.hidden = !isCurrentlyHidden;
  toggleTools.textContent = isCurrentlyHidden ? 'Bulk tools ▴' : 'Bulk tools ▾';
}); }

if (toggleSummaryPanel) { toggleSummaryPanel.addEventListener('click', () => {
  summaryGenerator.hidden = !summaryGenerator.hidden;
  if (!summaryGenerator.hidden) {
    summaryGenerator.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}); }

if (addBulletBtn) { addBulletBtn.addEventListener('click', () => {
  const row = createBulletRow('');
  const input = row.querySelector('.bullet-input');
  if (input) input.focus();
}); }

if (isCurrentRoleCheckbox) { isCurrentRoleCheckbox.addEventListener('change', (event) => {
  const isCurrent = event.target.checked;
  if (experienceForm.elements.end_date) {
    experienceForm.elements.end_date.disabled = isCurrent;
    if (isCurrent) experienceForm.elements.end_date.value = '';
  }
}); }

if (polishBulletsAi) { polishBulletsAi.addEventListener('click', () => {
  syncHighlightsTextarea();
  experienceGenerator.hidden = false;
  generateExperienceDraft();
}); }

if (rewordExperienceAi) { rewordExperienceAi.addEventListener('click', () => {
  syncHighlightsTextarea();
  experienceGenerator.hidden = false;
  experienceGenerator.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  generateExperienceDraft();
}); }

if (cancelEdit) { cancelEdit.addEventListener('click', resetForm); }
if (importResume) { importResume.addEventListener('click', importResumeEntries); }
if (synthesizeRepos) { synthesizeRepos.addEventListener('click', synthesizeRepositoryEntries); }
if (keepGeneratedDescription) { keepGeneratedDescription.addEventListener('click', () => {
  experienceForm.elements.description.value = generatedExperienceDescription;
  showExperienceMessage('LLM-generated description selected. Save the role to keep it.');
}); }
if (keepGeneratedBullets) { keepGeneratedBullets.addEventListener('click', () => {
  if (generatedResumeBullets && generatedResumeBullets.length) {
    populateBulletsRepeater(generatedResumeBullets);
    showExperienceMessage('LLM-generated bullets applied to form fields! Save the role to commit them.');
  } else {
    showExperienceMessage('LLM-generated bullets selected. Save the role to keep them.');
  }
}); }
if (generateResume) { generateResume.addEventListener('click', () => {
  if (experienceForm.hidden) { window.open('resume.html', '_blank', 'noopener'); return; }
  summaryGenerator.hidden = false;
  summaryGenerator.scrollIntoView({ behavior: 'smooth', block: 'center' });
  generateFullResumeDraft();
}); }
if (generateSummary) { generateSummary.addEventListener('click', generateSummaryDraft); }
if (saveSummary) { saveSummary.addEventListener('click', saveApprovedSummary); }
if (publishResume) { publishResume.addEventListener('click', () => saveApprovedSummary(true)); }

if (experienceForm) { experienceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(experienceForm);
  const payload = {
    company: formData.get('company').trim(),
    role: formData.get('role').trim(),
    location: formData.get('location').trim() || null,
    start_date: `${formData.get('start_date')}-01`,
    end_date: formData.get('end_date') ? `${formData.get('end_date')}-01` : null,
    description: formData.get('description').trim() || null,
    highlights: formData.get('highlights').split('\n').map((item) => item.trim()).filter(Boolean),
    lessons_learned: formData.get('lessons_learned').split('\n').map((item) => item.trim()).filter(Boolean),
    technologies: formData.get('technologies').split(',').map((item) => item.trim()).filter(Boolean),
    source_repo: formData.get('source_repo').trim() || null,
    include_in_resume: experienceForm.elements.include_in_resume.checked,
    original_resume_bullets: originalResumeBullets.length ? originalResumeBullets : getOriginalBulletsFromForm(),
    resume_bullets: generatedResumeBullets.length
      ? generatedResumeBullets
      : (editingExperience && editingExperience.resume_bullets ? editingExperience.resume_bullets : []),
    sort_order: Number.parseInt(formData.get('sort_order'), 10) || 0
  };
  if (payload.source_repo) {
    const bulletError = validateResumeBullets(payload.resume_bullets);
    if (bulletError) { showMessage(bulletError); return; }
  }
  if (isDemoMode && (!supabaseClient || !currentSession)) {
    if (editingExperience) {
      const idx = experiences.findIndex((e) => e.id === editingExperience.id || e === editingExperience);
      if (idx >= 0) experiences[idx] = { ...editingExperience, ...payload };
    } else {
      experiences.unshift({ id: `demo-${Date.now()}`, ...payload });
    }
    resetForm(true);
    renderExperiences();
    showMessage('Role saved locally in demo mode.');
    return;
  }
  const query = editingExperience
    ? supabaseClient.from('work_experience').update(payload).eq('id', editingExperience.id)
    : supabaseClient.from('work_experience').insert(payload);
  const { error } = await query;
  if (error) { showMessage('The role could not be saved. Check the dates and try again.'); return; }
  resetForm();
  await loadExperiences();
}); }

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => updateAuthUi(data.session));
  supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUi(session));
} else {
  updateAuthUi(null);
}
