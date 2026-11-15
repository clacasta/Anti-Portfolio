document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.getElementById('project-list');
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // The initial theme is applied by the inline script in index.html's <head>
    // to avoid a flash of the light theme.
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            // Storage may be unavailable (private mode, file:// restrictions).
        }
    });

    // Using a global variable from projects.js to avoid CORS issues with local file:// protocol
    if (typeof projectsData !== 'undefined') {
        renderProjects(projectsData);
    } else {
        console.error('Error loading projects: projectsData is undefined');
        projectList.innerHTML = '<p class="status-message status-error">Error loading projects. Data source missing.</p>';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderProjects(projects) {
        projectList.innerHTML = ''; // Clear loading message

        projects.forEach(project => {
            const card = document.createElement('article');
            card.className = 'project-card';

            const tags = Array.isArray(project.tags)
                ? project.tags
                : (project.tags ? [project.tags] : []);
            const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');

            const reasonHtml = project.reason
                ? `<div class="project-reason">
                    <span class="reason-label">Why it died</span>
                    <p class="reason-text">"${escapeHtml(project.reason)}"</p>
                </div>`
                : '';

            card.innerHTML = `
                <div class="project-header">
                    <h2 class="project-title">${escapeHtml(project.title || 'Untitled idea')}</h2>
                    <span class="project-date">${escapeHtml(project.date)}</span>
                </div>
                <div class="project-description text-content">${marked.parse(project.description || '')}</div>
                ${reasonHtml}
                <div class="tags">
                    ${tagsHtml}
                </div>
            `;

            projectList.appendChild(card);
        });
    }
});
