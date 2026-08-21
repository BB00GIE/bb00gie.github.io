const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const projectList = document.querySelector('#project-list');
const githubUsername = 'BB00GIE';

menuToggle?.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => revealObserver.observe(item));

const projectVisuals = ['dashboard', 'orbit', 'library'];
const projectColors = ['project-yellow', 'project-pink', 'project-blue'];

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const createVisual = (index, name) => {
  const visual = createElement('div', `project-visual visual-${projectVisuals[index % projectVisuals.length]}`);

  if (index % 3 === 0) {
    const window = createElement('div', 'visual-window');
    window.append(createElement('span', 'window-dots', '● ● ●'));
    window.append(createElement('span', 'visual-title', name.toUpperCase().slice(0, 24)));
    const chart = createElement('div', 'chart');
    [30, 55, 42, 80, 65, 92].forEach((height) => {
      const bar = createElement('i');
      bar.style.height = `${height}%`;
      chart.append(bar);
    });
    window.append(chart);
    const labels = createElement('div', 'chart-labels');
    ['MON', 'WED', 'FRI'].forEach((label) => labels.append(createElement('span', '', label)));
    window.append(labels);
    visual.append(window);
  } else if (index % 3 === 1) {
    visual.append(createElement('div', 'orbit-ring ring-one'), createElement('div', 'orbit-ring ring-two'));
    const core = createElement('div', 'orbit-core', String(index + 1).padStart(2, '0'));
    core.append(createElement('small', '', 'github repo'));
    visual.append(core);
    [['label-one', 'build'], ['label-two', 'learn'], ['label-three', 'repeat']].forEach(([className, label]) => visual.append(createElement('span', `orbit-label ${className}`, label)));
  } else {
    visual.append(createElement('div', 'library-card card-back'), createElement('div', 'library-card card-middle'));
    const card = createElement('div', 'library-card card-front');
    card.append(createElement('span', '', `${name.slice(0, 18)}\nopen source\nwork.`));
    card.append(createElement('b', '', '↗'));
    visual.append(card);
  }

  return visual;
};

const createProject = (repo, index) => {
  const project = createElement('article', `project ${projectColors[index % projectColors.length]} reveal`);
  project.append(createVisual(index, repo.name));
  const copy = createElement('div', 'project-copy');
  const meta = createElement('div', 'project-meta');
  meta.append(createElement('span', '', `${String(index + 1).padStart(2, '0')} / GitHub repository`));
  meta.append(createElement('span', '', new Date(repo.pushed_at || repo.updated_at).getFullYear().toString()));
  copy.append(meta);
  copy.append(createElement('h2', '', repo.name.replace(/[-_]/g, ' ')));
  copy.append(createElement('p', '', repo.description || 'A project in progress, built to solve a useful problem.'));
  const tags = createElement('div', 'project-tags');
  [repo.language, ...(repo.topics || []).slice(0, 2)].filter(Boolean).forEach((tag) => tags.append(createElement('span', '', tag)));
  if (!tags.children.length) tags.append(createElement('span', '', 'Open source'));
  copy.append(tags);
  const link = createElement('a', 'text-link', 'View project ');
  link.href = repo.html_url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.append(createElement('span', '', '↗'));
  copy.append(link);
  project.append(copy);
  return project;
};

const loadProjects = async () => {
  if (!projectList) return;
  try {
    const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repos = (await response.json()).filter((repo) => !repo.fork && !repo.private && repo.visibility === 'public');
    projectList.replaceChildren(...repos.map(createProject));
    projectList.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
  } catch (error) {
    projectList.replaceChildren(createElement('p', 'project-status', 'Projects could not load right now. View them on GitHub.'));
    const link = createElement('a', 'text-link', 'Open GitHub profile ');
    link.href = `https://github.com/${githubUsername}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.append(createElement('span', '', '↗'));
    projectList.append(link);
  }
};

loadProjects();
