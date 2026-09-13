const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig && !supabaseConfig.url.includes('YOUR-PROJECT')
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
const experienceTarget = document.querySelector('#resume-experience');
const projectTarget = document.querySelector('#resume-projects');
const summaryTarget = document.querySelector('#resume-summary');
const currentResume = {
  summary: 'Full Stack Software Engineer with over 4 years of experience designing, building, and scaling enterprise software solutions. Proven track record of leveraging data-driven methodologies, predictive algorithms, and responsive system design to optimize product features, reduce infrastructure latency, and drive seamless cross-functional execution.',
  experiences: [
    {
      id: 'google',
      company: 'Google',
      role: 'Full-Stack Software Engineer',
      start_date: '2022-06-01',
      end_date: '2026-08-01',
      highlights: [
        'Scaled natural language understanding (NLU) pipelines for shopping intents from 5 to 31 international locales, expanding product reach to 10M+ daily active users in close collaboration with product managers and research teams.',
        'Architected Java backend data pipelines and TypeScript/React UI enhancements for Autobuy product cards, processing 500k+ daily notifications via CI/CD pipelines.',
        'Spearheaded A/B testing initiatives to evaluate new shopping intent selector chips, achieving a 5% increase in Deals journeys.',
        'Implemented an automated release scheduling system with integrated testing frameworks, guaranteeing 100% adherence to EU regulatory standards across feature launches.',
        'Partnered with product managers to design AI prompts for AI mode (AIM), enabling intent detection and high-volume lookups for complementary product recommendations.'
      ]
    },
    {
      id: 'amazon',
      company: 'Amazon (EC2)',
      role: 'Software Engineer Intern',
      location: 'Seattle, WA',
      start_date: '2021-05-01',
      end_date: '2021-08-01',
      highlights: [
        'Designed and deployed a proactive autoscaling algorithm on AWS EC2, cutting server provisioning latency by 20% during high-volume traffic surges.',
        'Mitigated high-latency buffer times and sustained 99.99% enterprise system availability for major partners handling over 1M concurrent requests during peak events.',
        'Conducted in-depth data analysis and facilitated technical code reviews, partnering with cross-functional engineering leads to gain approval for production deployment.'
      ]
    },
    {
      id: 'delaware-state',
      company: 'Delaware State University',
      role: 'Computer Science Tutor & Teaching Assistant',
      start_date: '2019-01-01',
      end_date: '2022-05-01',
      highlights: [
        'Facilitated small-group study sessions and provided one-on-one instruction in Data Structures.',
        'Guided students through foundational Computer Science concepts and provided ongoing peer mentorship.',
        'Transitioned tutoring operations across in-person, remote lockdown, and hybrid environments using virtual collaboration tools to maintain uninterrupted academic support.'
      ]
    }
  ],
  projects: [{
    id: 'portfolio-blog',
    company: 'Independent Project',
    role: 'Personal Portfolio/Blog',
    start_date: '2026-08-01',
    end_date: null,
    description: 'Responsive personal portfolio hosted on GitHub Pages using HTML5, CSS3, and JavaScript to showcase software projects and technical writing.',
    resume_bullets: [
      'Streamlined automated document generation pipelines using JavaScript and local LLM APIs, reducing generation latency by 40% for dynamic portfolio updates.',
      'Built full-stack post-management features with React and PostgreSQL, integrating GitHub Actions CI/CD workflows and automated testing frameworks.',
      'Engineered a responsive static site architecture with custom CSS3 flexbox and grid components for seamless cross-device compatibility and low page load times.'
    ]
  }]
};

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

const renderExperience = (experiences, previewExperiences = null) => {
  const previewBullets = new Map((previewExperiences || []).map((experience) => [experience.id, experience.bullets]));
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
    const highlights = (previewBullets.get(experience.id) || (experience.resume_bullets?.length ? experience.resume_bullets : experience.highlights || [])).filter(Boolean).slice(0, 5);
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
    const heading = createElement('div', 'resume-role-heading');
    heading.append(
      createElement('h3', '', project.role),
      createElement('span', '', `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`)
    );
    article.append(heading);
    article.append(createElement('p', 'resume-company', [project.company, project.location].filter(Boolean).join(' / ')));
    if (project.description) article.append(createElement('p', '', project.description));
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
  if (!preview) {
    renderExperience(currentResume.experiences);
    renderProjects(currentResume.projects);
    return;
  }
  const { data, error } = await supabaseClient
    .from('work_experience')
    .select('id, company, role, location, start_date, end_date, description, highlights, resume_bullets, source_repo, include_in_resume, sort_order')
    .order('sort_order')
    .order('start_date', { ascending: false });
  if (!error && data?.length) {
    renderExperience(data.filter((experience) => !experience.source_repo), preview?.experiences?.filter((experience) => data.some((item) => item.id === experience.id)));
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
  summaryTarget.textContent = currentResume.summary;
  if (!preview) return;
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('resume_profile').select('summary').eq('id', 1).maybeSingle();
  if (!error && data?.summary) summaryTarget.textContent = data.summary;
};

loadExperience().catch(() => {});
loadSummary().catch(() => {});
