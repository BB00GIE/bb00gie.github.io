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
const formMessage = document.querySelector('#form-message');
const cancelEdit = document.querySelector('#cancel-edit');
const importResume = document.querySelector('#import-resume');
const synthesizeRepos = document.querySelector('#synthesize-repos');
const generateResume = document.querySelector('#generate-resume');
const summaryGenerator = document.querySelector('#summary-generator');
const generateSummary = document.querySelector('#generate-summary');
const saveSummary = document.querySelector('#save-summary');
const summaryReview = document.querySelector('#summary-review');
const summaryReviewLabel = document.querySelector('#summary-review-label');
const summarySourceCount = document.querySelector('#summary-source-count');
const summaryMessage = document.querySelector('#summary-message');
const resumeDraftReview = document.querySelector('#resume-draft-review');
const resumeDraftRoles = document.querySelector('#resume-draft-roles');
const resumeAiConfig = window.RESUME_AI_CONFIG || { endpoint: 'http://127.0.0.1:11434/api/generate', model: 'qwen3:4b' };
const experienceGenerator = document.querySelector('#experience-generator');
const experienceReview = document.querySelector('#experience-review');
const originalHighlights = document.querySelector('#original-highlights');
const originalDescription = document.querySelector('#original-description');
const generatedDescription = document.querySelector('#generated-description');
const generatedBullets = document.querySelector('#generated-bullets');
const keepGeneratedDescription = document.querySelector('#keep-generated-description');
const keepGeneratedBullets = document.querySelector('#keep-generated-bullets');
const experienceMessage = document.querySelector('#experience-message');
let editingExperience = null;
let experiences = [];
let currentSession = null;
let generatedProjectBullets = [];
let generatedExperienceBullets = [];
let generatedResumeBullets = [];
let originalResumeBullets = [];
let originalExperienceDescription = '';
let generatedExperienceDescription = '';
const resumeExperiences = [
  {
    company: 'Google',
    role: 'Full Stack Software Engineer',
    location: null,
    start_date: '2022-06-01',
    end_date: null,
    description: 'Worked on the Core Shopping team to create a positive shopping experience on Google Search.',
    highlights: [
      'Created end-to-end data pipelines to extend the user experience to other locales.',
      'Conducted A/B testing and data analysis to determine the impact of new features.',
      'Leveraged LLMs to create new user experiences on Search.'
    ],
    lessons_learned: [],
    technologies: ['C++', 'Java', 'Python', 'JavaScript', 'SQL', 'Git'],
    source_repo: null,
    sort_order: 0
  },
  {
    company: 'Amazon',
    role: 'Software Engineer Intern (EC2)',
    location: 'Seattle, WA',
    start_date: '2021-05-01',
    end_date: '2021-08-01',
    description: 'Worked on a project aimed at improving the autoscaling algorithm and optimizing the existing implementation.',
    highlights: ['Collaborated with team members to design and implement the new algorithm.'],
    lessons_learned: [],
    technologies: ['C++', 'Java', 'Python'],
    source_repo: null,
    sort_order: 1
  },
  {
    company: 'Delaware State University',
    role: 'Computer Science Tutor and Teaching Assistant',
    location: null,
    start_date: '2019-01-01',
    end_date: '2022-05-01',
    description: 'Helped students with Python and Java programming while developing weekly coding challenges.',
    highlights: [],
    lessons_learned: [],
    technologies: ['Python', 'Java'],
    source_repo: null,
    sort_order: 2
  }
];

const showMessage = (message) => {
  formMessage.hidden = false;
  formMessage.textContent = message;
};

const showSummaryMessage = (message) => {
  summaryMessage.hidden = false;
  summaryMessage.textContent = message;
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
  generateResume.disabled = true;
  saveSummary.hidden = true;
  summaryReviewLabel.hidden = true;
  resumeDraftReview.hidden = true;
  showSummaryMessage('Generating a resume from your work experience...');
  try {
    const response = await fetch(resumeAiConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: resumeAiConfig.model,
        stream: false,
        format: 'json',
        think: false,
        prompt: `Create a resume draft using only these work experience facts. Write a concise profile summary in 2-3 sentences and 3-5 distinct resume bullets for every entry. Make each bullet focus on a different supplied fact. Do not invent metrics, scope, users, results, responsibilities, technologies, employers, or outcomes. Preserve every entry id exactly. Return JSON only in this exact shape: {"summary":"...","experiences":[{"id":"entry id","bullets":["bullet 1"]}]}. Include every entry exactly once. Work experience facts:\n${JSON.stringify(workExperience)}`
      })
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const result = await response.json();
    const generated = JSON.parse(result.response || result.thinking || '{}');
    const summary = typeof generated.summary === 'string' ? generated.summary.trim() : '';
    generatedExperienceBullets = workExperience.map((experience) => {
      const draft = generated.experiences?.find((item) => item.id === experience.id);
      const bullets = (draft?.bullets || []).filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5);
      if (bullets.length < 3) throw new Error(`The model returned fewer than 3 bullets for ${experience.role}. Add more highlights and try again.`);
      return { id: experience.id, company: experience.company, role: experience.role, bullets };
    });
    if (!summary || summary.length > 700) throw new Error('The model returned an unusable summary.');
    generatedProjectBullets = generatedExperienceBullets.filter(({ id }) => workExperience.find((experience) => experience.id === id)?.source_repo);
    summaryReview.value = summary;
    summaryReviewLabel.hidden = false;
    resumeDraftReview.hidden = false;
    renderResumeDraftRoles();
    saveSummary.hidden = false;
    showSummaryMessage('Resume draft generated. Review the summary and bullets before saving or opening the preview.');
    localStorage.setItem('resumePreview', JSON.stringify({ summary, experiences: generatedExperienceBullets, projects: generatedProjectBullets }));
    window.open(`resume.html?preview=${Date.now()}`, '_blank', 'noopener');
  } catch (error) {
    console.error('Ollama full resume generation failed:', error);
    showSummaryMessage(`Ollama could not generate the resume. ${error instanceof TypeError ? 'Check that ollama serve is running and allows this site origin.' : error.message}`);
  } finally {
    generateResume.disabled = false;
  }
};

const generateSummaryDraft = async (openPreview = false) => {
  const projects = selectedProjects();
  if (!projects.length) { showSummaryMessage('Select at least one GitHub project for the summary.'); return; }
  generateSummary.disabled = true;
  saveSummary.hidden = true;
  summaryReviewLabel.hidden = true;
  showSummaryMessage('Connecting to your local Ollama model...');
  try {
    const response = await fetch(resumeAiConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: resumeAiConfig.model,
        stream: false,
        format: 'json',
        think: false,
        prompt: `Create a resume draft using only the supplied project facts. Write a concise professional profile summary in 2-3 sentences. For every project, rewrite its supplied bullets into 3-5 distinct concise resume bullets, with each bullet focusing on a different supplied fact. Do not invent metrics, employers, job titles, dates, technologies, users, or outcomes. Return JSON only in this exact shape: {"summary":"...","projects":[{"id":"project id","bullets":["bullet 1"]}]}. Include every project exactly once, preserve each project id, and return between 3 and 5 bullets per project. Project facts:\n${JSON.stringify(projects)}`
      })
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const result = await response.json();
    const generated = JSON.parse(result.response || '{}');
    const draft = generated.summary?.trim();
    generatedProjectBullets = projects.map((project) => {
      const generatedProject = generated.projects?.find((item) => item.id === project.id);
      const bullets = (generatedProject?.bullets || []).filter((bullet) => typeof bullet === 'string' && bullet.trim()).slice(0, 3);
      if (bullets.length < 3) throw new Error(`The model returned fewer than 3 bullets for ${project.name}.`);
      return { id: project.id, bullets };
    });
    if (!draft || draft.length > 700) throw new Error('The model returned an unusable summary.');
    summaryReview.value = draft;
    summaryReviewLabel.hidden = false;
    saveSummary.hidden = false;
    showSummaryMessage('Draft generated. Review every claim before saving.');
    if (openPreview) {
      localStorage.setItem('resumePreview', JSON.stringify({ summary: draft, projects: generatedProjectBullets }));
      const previewUrl = `resume.html?preview=${Date.now()}`;
      window.open(previewUrl, '_blank', 'noopener');
    }
  } catch (error) {
    console.error('Ollama summary generation failed:', error);
    const detail = error instanceof TypeError
      ? 'The browser could not reach Ollama. Check that ollama serve is running and allows this site origin.'
      : error.message;
    showSummaryMessage(`Ollama could not generate a draft. ${detail}`);
  } finally {
    generateSummary.disabled = false;
  }
};

const saveApprovedSummary = async () => {
  const summary = summaryReview.value.trim();
  if (!summary || summary.length > 700) { showSummaryMessage('Enter a summary between 1 and 700 characters.'); return; }
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
    if (results.some((result) => result.error)) showSummaryMessage('Summary saved, but some project bullets could not be updated.');
    else showSummaryMessage('Approved summary and experience bullets saved to your resume.');
  }
  saveSummary.disabled = false;
};

const getResumeBullets = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

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
  experienceMessage.textContent = message;
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
    highlights: getResumeBullets(formData.get('highlights')).slice(0, 10),
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
  originalResumeBullets = facts.highlights.slice(0, 5);
  showExperienceMessage('Connecting to your local Ollama model...');
  try {
    const response = await fetch(resumeAiConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: resumeAiConfig.model,
        stream: false,
        format: 'json',
        think: false,
        prompt: `Create a resume-ready version of this work experience. Write one accurate description in 2-4 sentences and summarize the supplied highlights into 1-5 concise resume bullets. Use only the supplied facts. Do not invent metrics, scale, users, results, responsibilities, technologies, or outcomes. Keep the employer and role clear, use past tense unless the end date is Present, and do not mention that you are an AI. Return JSON only in this exact shape: {"description":"...","bullets":["bullet 1"]}. Work experience facts: ${JSON.stringify(facts)}`
      })
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const result = await response.json();
    const generated = JSON.parse(result.response || result.thinking || '{}');
    generatedExperienceDescription = typeof generated.description === 'string' ? generated.description.trim() : '';
    generatedResumeBullets = (generated.bullets || []).filter((bullet) => typeof bullet === 'string' && bullet.trim()).map((bullet) => bullet.trim()).slice(0, 5);
    if (!generatedExperienceDescription || generatedExperienceDescription.length > 1000 || generatedResumeBullets.length < 3) throw new Error('The model returned fewer than 3 resume bullets. Add more highlights and try again.');
    originalDescription.textContent = originalExperienceDescription || 'No original description entered.';
    renderBulletList(originalHighlights, originalResumeBullets);
    generatedDescription.textContent = generatedExperienceDescription;
    renderBulletList(generatedBullets, generatedResumeBullets);
    experienceReview.hidden = false;
    showExperienceMessage('Draft generated. Approve the generated description or bullets, then save the role.');
  } catch (error) {
    console.error('Ollama experience draft generation failed:', error);
    const detail = error instanceof TypeError
      ? 'The browser could not reach Ollama. Check that ollama serve is running and allows this site origin.'
      : error.message;
    showExperienceMessage(`Ollama could not generate a resume draft. ${detail}`);
  } finally {
  }
};

const validateResumeBullets = (bullets) => {
  if (bullets.length > 5) return 'Use no more than 5 resume bullets per project.';
  const invalidBullet = bullets.find((bullet) => (bullet.match(/[.!?]+(?=\s|$)/g) || []).length > 2);
  return invalidBullet ? 'Each resume bullet must be 1-2 sentences.' : null;
};

const resetForm = () => {
  editingExperience = null;
  experienceForm.reset();
  experienceForm.elements.sort_order.value = '0';
  formHeading.textContent = 'New role';
  cancelEdit.hidden = true;
  formMessage.hidden = true;
  experienceGenerator.hidden = true;
  experienceReview.hidden = true;
  generatedResumeBullets = [];
  originalResumeBullets = [];
  originalExperienceDescription = '';
  generatedExperienceDescription = '';
  experienceMessage.hidden = true;
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
    if (experience.highlights?.length) {
      const list = document.createElement('ul');
      experience.highlights.forEach((highlight) => {
        const item = document.createElement('li');
        item.textContent = highlight;
        list.append(item);
      });
      article.append(list);
    }
    if (experience.lessons_learned?.length) {
      const lessons = document.createElement('p');
      lessons.textContent = `Learned: ${experience.lessons_learned.join(' | ')}`;
      article.append(lessons);
    }
    if (experience.technologies?.length) {
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
      resumeNote.textContent = experience.include_in_resume === false
        ? 'Excluded from generated resume.'
        : `${(experience.resume_bullets?.length || experience.highlights?.length || 0)} resume bullet${(experience.resume_bullets?.length || experience.highlights?.length || 0) === 1 ? '' : 's'} selected.`;
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
    ['Edit', 'Delete', 'Re-word with AI'].forEach((label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        if (label === 'Edit') beginEdit(experience);
        else if (label === 'Delete') deleteExperience(experience.id);
        else {
          beginEdit(experience, true);
          generateExperienceDraft();
        }
      });
      actions.append(button);
    });
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
  originalResumeBullets = (experience.original_resume_bullets?.length
    ? experience.original_resume_bullets
    : experience.highlights?.length ? experience.highlights : experience.resume_bullets || []).slice(0, 5);
  Object.entries(experience).forEach(([key, value]) => {
    if (!experienceForm.elements[key]) return;
    experienceForm.elements[key].value = Array.isArray(value)
      ? (key === 'highlights' ? value.join('\n') : value.join(', '))
      : (key.endsWith('_date') && value ? value.slice(0, 7) : value || '');
  });
  experienceForm.elements.include_in_resume.checked = experience.include_in_resume !== false;
  experienceGenerator.hidden = !showAiReview;
  experienceReview.hidden = true;
  formHeading.textContent = 'Edit role';
  cancelEdit.hidden = false;
  experienceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteExperience = async (id) => {
  if (!window.confirm('Delete this role?')) return;
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
      experience.company === entry.company
      && experience.role === entry.role
      && experience.start_date === entry.start_date
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
    commits: commits.map((commit) => commit.commit?.message?.split('\n')[0]?.slice(0, 240)).filter(Boolean),
    pullRequests: pullRequests.map((pullRequest) => ({
      title: pullRequest.title,
      body: pullRequest.body?.trim().slice(0, 240)
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

const removeUnavailableRepositoryEntries = async (repos) => {
  const publicRepositoryPrefixes = new Set(repos.map((repo) => getRepositoryPrefix(repo.full_name)));
  const unavailableEntries = experiences.filter((experience) => {
    const sourceRepo = experience.source_repo?.replace(/\/$/, '');
    const repositoryName = sourceRepo?.replace('https://github.com/', '');
    return repositoryName?.startsWith('BB00GIE/') && !publicRepositoryPrefixes.has(repositoryName);
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
    const entries = repositoryGroups.map(([prefix, groupedRepos]) => {
      const groupActivities = groupedRepos.map((repo) => activity[repos.indexOf(repo)]);
      return synthesizeProject(groupedRepos[0], groupedRepos, updates, {
        commits: groupActivities.flatMap((item) => item.commits),
        pullRequests: groupActivities.flatMap((item) => item.pullRequests)
      });
    });
    const result = await syncExperienceEntries(entries, (experience, entry) => experience.source_repo === entry.source_repo || getRepositoryPrefix(experience.source_repo?.replace('https://github.com/', '') || '') === getRepositoryPrefix(entry.source_repo.replace('https://github.com/', '')));
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
  if (!session) {
    authStatus.textContent = supabaseClient ? 'Public experience record. Sign in to manage it.' : 'Supabase is not configured yet.';
    signIn.hidden = !supabaseClient;
    signOut.hidden = true;
    experienceForm.hidden = true;
    summaryGenerator.hidden = true;
    if (supabaseClient) {
      try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
    }
    return;
  }
  signIn.hidden = true;
  signOut.hidden = false;
  authStatus.textContent = `Signed in as ${session.user.user_metadata?.user_name || session.user.email || 'your account'}.`;
  const { data: allowedAuthor, error } = await supabaseClient.from('allowed_authors').select('user_id').eq('user_id', session.user.id).eq('github_username', 'BB00GIE').maybeSingle();
  if (error || !allowedAuthor) {
    experienceForm.hidden = true;
    summaryGenerator.hidden = true;
    accessMessage.hidden = false;
    accessMessage.textContent = error ? 'Access could not be checked. Run the Supabase schema first.' : 'You can view this record, but only Brandon can update it.';
    try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
    return;
  }
  accessMessage.hidden = true;
  experienceForm.hidden = false;
  summaryGenerator.hidden = false;
  experienceGenerator.hidden = true;
  try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
};

signIn?.addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.href } });
});

signOut?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  updateAuthUi(null);
});

cancelEdit?.addEventListener('click', resetForm);
importResume?.addEventListener('click', importResumeEntries);
synthesizeRepos?.addEventListener('click', synthesizeRepositoryEntries);
keepGeneratedDescription?.addEventListener('click', () => {
  experienceForm.elements.description.value = generatedExperienceDescription;
  showExperienceMessage('LLM-generated description selected. Save the role to keep it.');
});
keepGeneratedBullets?.addEventListener('click', () => {
  showExperienceMessage('LLM-generated bullets selected. Save the role to keep them.');
});
generateResume?.addEventListener('click', () => {
  if (experienceForm.hidden) { window.open('resume.html', '_blank', 'noopener'); return; }
  summaryGenerator.hidden = false;
  summaryGenerator.scrollIntoView({ behavior: 'smooth', block: 'center' });
  generateFullResumeDraft();
});
generateSummary?.addEventListener('click', generateSummaryDraft);
saveSummary?.addEventListener('click', saveApprovedSummary);

experienceForm?.addEventListener('submit', async (event) => {
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
    include_in_resume: formData.get('include_in_resume') === 'on',
    original_resume_bullets: (originalResumeBullets.length ? originalResumeBullets : getOriginalBulletsFromForm()).slice(0, 5),
    resume_bullets: generatedResumeBullets.length
      ? generatedResumeBullets
      : editingExperience?.resume_bullets || [],
    sort_order: Number.parseInt(formData.get('sort_order'), 10) || 0
  };
  if (payload.source_repo) {
    const bulletError = validateResumeBullets(payload.resume_bullets);
    if (bulletError) { showMessage(bulletError); return; }
  }
  const query = editingExperience
    ? supabaseClient.from('work_experience').update(payload).eq('id', editingExperience.id)
    : supabaseClient.from('work_experience').insert(payload);
  const { error } = await query;
  if (error) { showMessage('The role could not be saved. Check the dates and try again.'); return; }
  resetForm();
  await loadExperiences();
});

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => updateAuthUi(data.session));
  supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUi(session));
} else {
  updateAuthUi(null);
}
