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
const updateFormHeading = document.querySelector('#update-form-heading');
const cancelUpdate = document.querySelector('#update-cancel');
const submitButton = updateForm?.querySelector('button[type="submit"]');
const publishFeedback = document.querySelector('#publish-feedback');
const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig && !supabaseConfig.url.includes('YOUR-PROJECT')
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
let currentSession = null;
let isAllowedPublisher = false;
let editingUpdate = null;

const getUpdates = async () => {
  if (!supabaseClient || !repositoryName) return [];
  const { data, error } = await supabaseClient
    .from('project_updates')
    .select('id, repo_full_name, title, body, image_url, created_at')
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
    const date = new Date(update.created_at);
    const meta = document.createElement('p');
    meta.className = 'update-date';
    meta.textContent = Number.isNaN(date.getTime()) ? 'Project update' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const title = document.createElement('h2');
    title.textContent = update.title;
    const entryHeader = document.createElement('div');
    entryHeader.className = 'update-entry-header';
    const actions = document.createElement('div');
    actions.className = 'update-actions';
    if (isAllowedPublisher) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => beginEdit(update));
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => deleteUpdate(update));
      actions.append(editButton, deleteButton);
    }
    entryHeader.append(title, actions);
    const body = document.createElement('p');
    body.className = 'update-body';
    if (update.body) {
      appendLinkedText(body, update.body);
      article.append(body);
    }
    if (update.image_url) {
      const image = document.createElement('img');
      image.className = 'update-image';
      image.src = update.image_url;
      image.alt = update.title;
      image.loading = 'lazy';
      article.append(image);
    }
    article.prepend(meta, entryHeader);
    updatesElement.append(article);
  });
};

const imagePathFromUrl = (imageUrl) => imageUrl?.split('/project-updates/')[1] || null;

const resetUpdateForm = () => {
  editingUpdate = null;
  updateForm.reset();
  updateFormHeading.textContent = 'New update';
  submitButton.innerHTML = 'Publish update <span aria-hidden="true">+</span>';
  cancelUpdate.hidden = true;
  publishFeedback.hidden = true;
  publishFeedback.textContent = '';
};

const linkPattern = /Link\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)|(?:https?:\/\/|www\.)[^\s<]+/gi;

const normalizeLink = (value) => {
  const cleanValue = value.replace(/[.,!?;:)}\]]+$/, '');
  try {
    const url = new URL(cleanValue.startsWith('www.') ? `https://${cleanValue}` : cleanValue);
    return url.protocol === 'http:' || url.protocol === 'https:' ? { href: url.href, text: cleanValue } : null;
  } catch (error) {
    return null;
  }
};

const getPostLinks = (content) => {
  const links = [];
  for (const match of content.matchAll(linkPattern)) {
    const link = normalizeLink(match[1] || match[0]);
    if (link) links.push(link.href);
  }
  return [...new Set(links)];
};

const spellcheckPost = async (content) => {
  const request = new URLSearchParams({ text: content, language: 'en-US' });
  const response = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: request
  });
  if (!response.ok) throw new Error(`Spellcheck returned ${response.status}`);
  const result = await response.json();
  return result.matches || [];
};

const reviewPost = async (title, body) => {
  const content = `${title}\n${body}`;
  const links = getPostLinks(content);
  let spellingIssues = [];
  let spellcheckAvailable = true;
  try {
    spellingIssues = await spellcheckPost(content);
  } catch (error) {
    spellcheckAvailable = false;
  }
  return { links, spellingIssues, spellcheckAvailable };
};

const appendLinkedText = (element, content) => {
  let lastIndex = 0;
  for (const match of content.matchAll(linkPattern)) {
    const rawUrl = match[0];
    const customText = match[2];
    const link = normalizeLink(match[1] || rawUrl);
    if (!link) continue;
    element.append(document.createTextNode(content.slice(lastIndex, match.index)));
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = customText || link.text;
    element.append(anchor);
    if (!customText) element.append(document.createTextNode(rawUrl.slice(link.text.length)));
    lastIndex = match.index + rawUrl.length;
  }
  element.append(document.createTextNode(content.slice(lastIndex)));
};

const beginEdit = (update) => {
  editingUpdate = update;
  updateFormHeading.textContent = 'Edit update';
  updateForm.elements.title.value = update.title;
  updateForm.elements.body.value = update.body || '';
  updateForm.elements.image.value = '';
  submitButton.innerHTML = 'Save update <span aria-hidden="true">+</span>';
  cancelUpdate.hidden = false;
  updateForm.hidden = false;
  updateForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteUpdate = async (update) => {
  if (!window.confirm(`Delete "${update.title}"?`)) return;
  try {
    const { error } = await supabaseClient.from('project_updates').delete().eq('id', update.id);
    if (error) throw error;
    const imagePath = imagePathFromUrl(update.image_url);
    if (imagePath) await supabaseClient.storage.from('project-updates').remove([decodeURIComponent(imagePath)]);
    if (editingUpdate?.id === update.id) resetUpdateForm();
    renderUpdates();
  } catch (error) {
    accessMessage.hidden = false;
    accessMessage.textContent = 'This update could not be deleted. Please try again.';
  }
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
  isAllowedPublisher = false;
  if (!session) {
    authStatus.textContent = supabaseClient ? 'Sign in to publish project updates.' : 'Supabase is not configured yet.';
    signIn.hidden = !supabaseClient;
    signOut.hidden = true;
    updateForm.hidden = true;
    resetUpdateForm();
    accessMessage.hidden = true;
    renderUpdates();
    return;
  }

  authStatus.textContent = `Signed in as ${session.user.user_metadata?.user_name || session.user.email || 'your account'}.`;
  signIn.hidden = true;
  signOut.hidden = false;
  const { data: allowedAuthor, error: accessError } = await supabaseClient
    .from('allowed_authors')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (accessError) {
    updateForm.hidden = true;
    accessMessage.hidden = false;
    accessMessage.textContent = 'Publisher access could not be checked. Run the allowed_authors policy in Supabase.';
    renderUpdates();
    return;
  }
  isAllowedPublisher = Boolean(allowedAuthor);
  updateForm.hidden = !isAllowedPublisher;
  accessMessage.hidden = isAllowedPublisher;
  accessMessage.textContent = 'Your account can read updates but is not on the publishing allowlist.';
  renderUpdates();
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

cancelUpdate?.addEventListener('click', resetUpdateForm);

updateForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const publishUpdate = async () => {
    const formData = new FormData(updateForm);
    const title = formData.get('title')?.trim() || '';
    const body = formData.get('body')?.trim() || '';
    const image = formData.get('image');
    if (!body && !image?.size) {
      accessMessage.hidden = false;
      accessMessage.textContent = 'Add text or choose an image before publishing.';
      return;
    }
    if (image?.size > 5 * 1024 * 1024) {
      accessMessage.hidden = false;
      accessMessage.textContent = 'Images must be 5 MB or smaller.';
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    publishFeedback.hidden = true;
    try {
      const review = await reviewPost(title, body);
      const issueSummary = review.spellingIssues.slice(0, 5).map((issue) => {
        const suggestion = issue.replacements?.[0]?.value;
        return suggestion ? `${issue.context}: ${suggestion}` : issue.context;
      });
      const linkSummary = review.links.length ? `${review.links.length} link${review.links.length === 1 ? '' : 's'} found and will be made clickable.` : 'No links found.';
      publishFeedback.hidden = false;
      publishFeedback.textContent = review.spellcheckAvailable
        ? `${issueSummary.length ? `Spelling review: ${issueSummary.join(' | ')}. ` : 'Spelling review passed. '}${linkSummary}`
        : `Spellcheck is unavailable right now. ${linkSummary}`;
      if (issueSummary.length && !window.confirm('Spellcheck found possible issues. Publish this update anyway?')) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        return;
      }
    } catch (error) {
      publishFeedback.hidden = false;
      publishFeedback.textContent = 'The content review could not run. Please check the text and try again.';
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      return;
    }
    let imageUrl = editingUpdate?.image_url || null;
    let imagePath = null;
    try {
      if (image?.size) {
        imagePath = `${currentSession.user.id}/${crypto.randomUUID()}-${image.name}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('project-updates')
          .upload(imagePath, image, { contentType: image.type, upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = supabaseClient.storage.from('project-updates').getPublicUrl(imagePath).data.publicUrl;
      }

      const updateData = { title, body: body || null, image_url: imageUrl };
      const query = editingUpdate
        ? supabaseClient.from('project_updates').update(updateData).eq('id', editingUpdate.id)
        : supabaseClient.from('project_updates').insert({ ...updateData, repo_full_name: repositoryName, author_id: currentSession.user.id });
      const { error } = await query;
      if (error) throw error;
      if (editingUpdate?.image_url && imagePath && editingUpdate.image_url !== imageUrl) {
        const oldImagePath = imagePathFromUrl(editingUpdate.image_url);
        if (oldImagePath) await supabaseClient.storage.from('project-updates').remove([decodeURIComponent(oldImagePath)]);
      }
    } catch (error) {
      if (imagePath) await supabaseClient.storage.from('project-updates').remove([imagePath]);
      accessMessage.hidden = false;
      accessMessage.textContent = 'This update could not be published. Check the image and try again.';
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      return;
    }
    resetUpdateForm();
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
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