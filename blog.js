const params = new URLSearchParams(window.location.search);
const requestedRepositoryName = params.get('repo');
const repositoryName = requestedRepositoryName
  ? `${requestedRepositoryName.slice(0, requestedRepositoryName.lastIndexOf('/') + 1)}${requestedRepositoryName.split('/').pop().split('_', 1)[0]}`
  : null;
const projectTitle = document.querySelector('#project-title');
const projectDescription = document.querySelector('#project-description');
const githubLink = document.querySelector('#github-link');
const updateForm = document.querySelector('#update-form');
const updatesElement = document.querySelector('#updates');
const updateCount = document.querySelector('#update-count');
const authStatus = document.querySelector('#auth-status');
const signIn = document.querySelector('#sign-in');
const signOut = document.querySelector('#sign-out');
const accessMessage = document.querySelector('#access-message');
const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig && !supabaseConfig.url.includes('YOUR-PROJECT')
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
let currentSession = null;

const getUpdates = async () => {
  if (!supabaseClient || !repositoryName) return [];
  const { data, error } = await supabaseClient
    .from('project_updates')
    .select('repo_full_name, title, body, created_at')
    .like('repo_full_name', `${repositoryName}%`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.filter((update) => update.repo_full_name === repositoryName || update.repo_full_name.startsWith(`${repositoryName}_`));
};

const renderUpdates = async () => {
  let updates = [];
  try {
    updates = await getUpdates();
  } catch (error) {
    const errorState = document.createElement('p');
    errorState.className = 'project-status';
    errorState.textContent = 'Updates could not load right now.';
    updatesElement.replaceChildren(errorState);
    return;
  }
  updateCount.textContent = `${updates.length} ${updates.length === 1 ? 'entry' : 'entries'}`;
  updatesElement.replaceChildren();

  if (!updates.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'project-status';
    emptyState.textContent = 'No updates yet. Add the first note below.';
    updatesElement.append(emptyState);
    return;
  }

  updates.forEach((update) => {
    const article = document.createElement('article');
    article.className = 'update-entry';
    const date = new Date(update.date);
    const meta = document.createElement('p');
    meta.className = 'update-date';
    meta.textContent = Number.isNaN(date.getTime()) ? 'Project update' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const title = document.createElement('h2');
    title.textContent = update.title;
    const body = document.createElement('p');
    body.textContent = update.body;
    article.append(meta, title, body);
    updatesElement.append(article);
  });
};

const loadProject = async () => {
  if (!repositoryName) {
    projectTitle.textContent = 'Project not found';
    projectDescription.textContent = 'Choose a project from the work section to view its updates.';
    renderUpdates();
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repositoryName}`);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repo = await response.json();
    projectTitle.textContent = repo.name.replace(/[-_]/g, ' ');
    projectDescription.textContent = repo.description || 'A project in progress, built to solve a useful problem.';
    githubLink.href = repo.html_url;
    githubLink.hidden = false;
  } catch (error) {
    projectTitle.textContent = repositoryName.split('/').pop().replace(/[-_]/g, ' ');
    projectDescription.textContent = 'Project details are unavailable right now, but your saved updates are still here.';
  }

  renderUpdates();
};

const updateAuthUi = async (session) => {
  currentSession = session;
  if (!session) {
    authStatus.textContent = supabaseClient ? 'Sign in to publish project updates.' : 'Supabase is not configured yet.';
    signIn.hidden = !supabaseClient;
    signOut.hidden = true;
    updateForm.hidden = true;
    accessMessage.hidden = true;
    return;
  }

  authStatus.textContent = `Signed in as ${session.user.user_metadata?.user_name || session.user.email || 'your account'}.`;
  signIn.hidden = true;
  signOut.hidden = false;
  const { data: allowedAuthor } = await supabaseClient
    .from('allowed_authors')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  updateForm.hidden = !allowedAuthor;
  accessMessage.hidden = Boolean(allowedAuthor);
  accessMessage.textContent = 'Your account can read updates but is not on the publishing allowlist.';
};

signIn?.addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.href }
  });
});

signOut?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  updateAuthUi(null);
});

updateForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const publishUpdate = async () => {
    const formData = new FormData(updateForm);
    const { error } = await supabaseClient.from('project_updates').insert({
      repo_full_name: repositoryName,
      title: formData.get('title').trim(),
      body: formData.get('body').trim(),
      author_id: currentSession.user.id
    });
    if (error) {
      accessMessage.hidden = false;
      accessMessage.textContent = 'This account cannot publish updates.';
      return;
    }
    updateForm.reset();
    renderUpdates();
  };
  publishUpdate();
});

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data: { session } }) => updateAuthUi(session));
  supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUi(session));
} else {
  updateAuthUi(null);
}

loadProject();