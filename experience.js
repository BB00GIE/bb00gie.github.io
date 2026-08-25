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
let editingExperience = null;
let experiences = [];
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

const resetForm = () => {
  editingExperience = null;
  experienceForm.reset();
  experienceForm.elements.sort_order.value = '0';
  formHeading.textContent = 'New role';
  cancelEdit.hidden = true;
  formMessage.hidden = true;
};

const formatDate = (value) => {
  if (!value) return 'Present';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const renderExperiences = () => {
  experienceCount.textContent = `${experiences.length} ${experiences.length === 1 ? 'entry' : 'entries'}`;
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
      const source = document.createElement('a');
      source.className = 'text-link';
      source.href = experience.source_repo;
      source.target = '_blank';
      source.rel = 'noreferrer';
      source.textContent = 'View repository ↗';
      article.append(source);
    }
    const actions = document.createElement('div');
    actions.className = 'update-actions';
    ['Edit', 'Delete'].forEach((label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => label === 'Edit' ? beginEdit(experience) : deleteExperience(experience.id));
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

const beginEdit = (experience) => {
  editingExperience = experience;
  Object.entries(experience).forEach(([key, value]) => {
    if (!experienceForm.elements[key]) return;
    experienceForm.elements[key].value = Array.isArray(value)
      ? (key === 'highlights' ? value.join('\n') : value.join(', '))
      : (key.endsWith('_date') && value ? value.slice(0, 7) : value || '');
  });
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

const importResumeEntries = async () => {
  importResume.disabled = true;
  try {
    const newEntries = resumeExperiences.filter((resumeExperience) => !experiences.some((experience) => (
      experience.company === resumeExperience.company
      && experience.role === resumeExperience.role
      && experience.start_date === resumeExperience.start_date
    )));
    if (!newEntries.length) {
      showMessage('Resume entries are already loaded.');
      return;
    }
    const { error } = await supabaseClient.from('work_experience').insert(newEntries);
    if (error) { showMessage('Resume entries could not be imported.'); return; }
    await loadExperiences();
    showMessage(`${newEntries.length} resume ${newEntries.length === 1 ? 'entry' : 'entries'} imported. Review and edit them below.`);
  } finally {
    importResume.disabled = false;
  }
};

const getProjectUpdates = async () => {
  const { data, error } = await supabaseClient.from('project_updates').select('repo_full_name, title, body').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
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

const synthesizeProject = (repo, updates, activity) => {
  const repoUpdates = updates.filter((update) => update.repo_full_name === repo.full_name || update.repo_full_name.startsWith(`${repo.full_name}_`));
  const updateText = repoUpdates.map((update) => `${update.title}${update.body ? `: ${update.body}` : ''}`).join(' ');
  const commitHighlights = activity.commits.slice(0, 5).map((message) => `Commit: ${message}`);
  const pullRequestHighlights = activity.pullRequests.slice(0, 5).map((pullRequest) => `PR: ${pullRequest.title}${pullRequest.body ? ` - ${pullRequest.body}` : ''}`);
  const description = repo.description || `Built and maintained ${repo.name} as an independent software project.`;
  const updateHighlights = repoUpdates.slice(0, 5).map((update) => `Journal: ${update.title}${update.body ? ` - ${update.body}` : ''}`);
  const highlights = [...updateHighlights, ...pullRequestHighlights, ...commitHighlights].slice(0, 10);
  const lessons = [
    repoUpdates.length ? `Documented project decisions and progress through ${repoUpdates.length} project journal ${repoUpdates.length === 1 ? 'entry' : 'entries'}.` : null,
    activity.pullRequests.length ? `Practiced breaking work into ${activity.pullRequests.length} pull request ${activity.pullRequests.length === 1 ? 'review' : 'reviews'}.` : null,
    activity.commits.length ? `Built iteratively through ${activity.commits.length} recent commits, using version control to refine the project.` : null,
    updateText.slice(0, 240)
  ].filter(Boolean).slice(0, 4);
  return {
    company: 'GitHub project',
    role: repo.name.replace(/[-_]/g, ' '),
    location: null,
    start_date: `${new Date(repo.created_at || repo.pushed_at).toISOString().slice(0, 7)}-01`,
    end_date: null,
    description,
    highlights: highlights.length ? highlights : [description],
    lessons_learned: lessons.length ? lessons : ['Practiced taking a software project from idea to a working implementation.'],
    technologies: [repo.language, ...(repo.topics || [])].filter(Boolean).slice(0, 8),
    source_repo: repo.html_url,
    sort_order: 100
  };
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
    const newRepos = repos.filter((repo) => !experiences.some((experience) => experience.source_repo === repo.html_url));
    const activity = await Promise.all(newRepos.map(async (repo) => {
      try { return await getRepositoryActivity(repo); } catch (error) { return { commits: [], pullRequests: [] }; }
    }));
    const newEntries = newRepos.map((repo, index) => synthesizeProject(repo, updates, activity[index]));
    if (!newEntries.length) { showMessage('GitHub project entries are already loaded.'); return; }
    const { error } = await supabaseClient.from('work_experience').insert(newEntries);
    if (error) { showMessage('GitHub projects could not be synthesized.'); return; }
    await loadExperiences();
    showMessage(`${newEntries.length} GitHub project ${newEntries.length === 1 ? 'entry' : 'entries'} synthesized. Review and edit them below.`);
  } catch (error) {
    showMessage('GitHub projects or project updates could not be loaded right now.');
  } finally {
    synthesizeRepos.disabled = false;
  }
};

const updateAuthUi = async (session) => {
  if (!session) {
    authStatus.textContent = supabaseClient ? 'Public experience record. Sign in to manage it.' : 'Supabase is not configured yet.';
    signIn.hidden = !supabaseClient;
    signOut.hidden = true;
    experienceForm.hidden = true;
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
    accessMessage.hidden = false;
    accessMessage.textContent = error ? 'Access could not be checked. Run the Supabase schema first.' : 'You can view this record, but only Brandon can update it.';
    try { await loadExperiences(); } catch (loadError) { showMessage('Saved experience could not load right now.'); }
    return;
  }
  accessMessage.hidden = true;
  experienceForm.hidden = false;
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
    sort_order: Number.parseInt(formData.get('sort_order'), 10) || 0
  };
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
