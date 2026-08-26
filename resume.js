const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig && !supabaseConfig.url.includes('YOUR-PROJECT')
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
const experienceTarget = document.querySelector('#resume-experience');
const projectTarget = document.querySelector('#resume-projects');
const summaryTarget = document.querySelector('#resume-summary');

const formatDate = (value) => {
  if (!value) return 'Present';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const renderExperience = (experiences) => {
  experienceTarget.replaceChildren();
  experiences.forEach((experience) => {
    const article = createElement('article', 'resume-role');
    const heading = createElement('div', 'resume-role-heading');
    heading.append(
      createElement('h3', '', experience.role),
      createElement('span', '', `${formatDate(experience.start_date)} - ${formatDate(experience.end_date)}`)
    );
    article.append(heading);
    article.append(createElement('p', 'resume-company', [experience.company, experience.location].filter(Boolean).join(' / ')));
    const highlights = (experience.resume_bullets?.length ? experience.resume_bullets : experience.highlights || []).filter(Boolean).slice(0, 5);
    if (highlights.length) {
      const list = createElement('ul');
      highlights.forEach((highlight) => list.append(createElement('li', '', highlight)));
      article.append(list);
    } else if (experience.description) {
      article.append(createElement('p', '', experience.description));
    }
    experienceTarget.append(article);
  });
};

const renderProjects = (projects, previewProjects = null) => {
  if (!projectTarget) return;
  const previewBullets = new Map((previewProjects || []).map((project) => [project.id, project.bullets]));
  projectTarget.replaceChildren();
  projects.forEach((project) => {
    const article = createElement('article', 'resume-project');
    article.append(createElement('h3', '', project.role));
    const bullets = (previewBullets.get(project.id) || project.resume_bullets || []).filter(Boolean).slice(0, 5);
    if (bullets.length) {
      const list = createElement('ul');
      bullets.forEach((bullet) => list.append(createElement('li', '', bullet)));
      article.append(list);
    } else if (project.description) {
      article.append(createElement('p', '', project.description));
    }
    projectTarget.append(article);
  });
};

const loadExperience = async () => {
  if (!supabaseClient || !experienceTarget) return;
  const preview = new URLSearchParams(window.location.search).has('preview')
    ? JSON.parse(localStorage.getItem('resumePreview') || 'null')
    : null;
  const { data, error } = await supabaseClient
    .from('work_experience')
    .select('company, role, location, start_date, end_date, description, highlights, resume_bullets, source_repo, include_in_resume, sort_order')
    .order('sort_order')
    .order('start_date', { ascending: false });
  if (!error && data?.length) {
    renderExperience(data.filter((experience) => !experience.source_repo));
    renderProjects(data.filter((experience) => experience.source_repo && experience.include_in_resume !== false), preview?.projects);
  }
};

const loadSummary = async () => {
  if (!summaryTarget) return;
  const preview = new URLSearchParams(window.location.search).has('preview')
    ? JSON.parse(localStorage.getItem('resumePreview') || 'null')
    : null;
  if (preview?.summary) {
    summaryTarget.textContent = preview.summary;
    return;
  }
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('resume_profile').select('summary').eq('id', 1).maybeSingle();
  if (!error && data?.summary) summaryTarget.textContent = data.summary;
};

loadExperience().catch(() => {});
loadSummary().catch(() => {});
