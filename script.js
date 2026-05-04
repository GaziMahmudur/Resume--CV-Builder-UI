// ─── SECTION: INITIAL STATE ───
let cvData = {
    personal: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', photo: '' },
    summary: { text: '' },
    experience: [],
    education: [],
    skills: { technical: [], languages: [], soft: [] },
    projects: [],
    extras: { 
        showCerts: false, certifications: [], 
        showAwards: false, achievements: [], 
        showInterests: false, interests: [] 
    },
    template: "classic"
};

const STORAGE_KEY = "resumeforge_data";
let renderTimer, saveTimer;

// ─── SECTION: DOM ELEMENTS ───
const previewEl = document.getElementById('cv-preview');
const formContainer = document.getElementById('form-container');
const tabsNav = document.getElementById('tabs-nav');
const templatePicker = document.getElementById('template-picker');
const downloadBtn = document.getElementById('download-pdf');
const clearBtn = document.getElementById('clear-data');
const saveIndicator = document.getElementById('save-indicator');
const overflowWarning = document.getElementById('overflow-warning');

// ─── SECTION: TABS LOGIC ───
tabsNav.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-link');
    if (!tab) return;
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`pane-${tab.dataset.tab}`).classList.add('active');
});

// ─── SECTION: DATA BINDING ───
function updateDataFromInput(el) {
    const path = el.dataset.path;
    const value = el.type === 'checkbox' ? el.checked : el.value;
    setDeepValue(cvData, path, value);
    
    if (path === 'summary.text') {
        const counter = document.getElementById('summary-counter');
        counter.innerText = `${value.length}/600`;
        counter.classList.toggle('limit', value.length > 550);
    }

    if (path === 'extras.showCerts') document.getElementById('certs-section').style.display = value ? 'block' : 'none';
    if (path === 'extras.showAwards') document.getElementById('awards-section').style.display = value ? 'block' : 'none';
    if (path === 'extras.showInterests') document.getElementById('interests-section').style.display = value ? 'block' : 'none';

    debouncedRender();
    debouncedSave();
    updateDownloadState();
}

function setDeepValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
    current[parts[parts.length - 1]] = value;
}

formContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('cv-input') || e.target.classList.contains('cv-toggle')) updateDataFromInput(e.target);
});

// ─── SECTION: PHOTO UPLOAD ───
document.getElementById('input-photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            cvData.personal.photo = event.target.result;
            document.getElementById('photo-preview').innerHTML = `<img src="${cvData.personal.photo}">`;
            debouncedRender();
            debouncedSave();
        };
        reader.readAsDataURL(file);
    }
});

// ─── SECTION: DYNAMIC LISTS (EXPERIENCE, EDUCATION, ETC.) ───
function createExperienceEntry(data = null) {
    const id = Date.now() + Math.random();
    const entry = data || { id, jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: '' };
    if (!data) cvData.experience.push(entry);
    const html = `<div class="dynamic-entry" id="exp-${entry.id}"><div class="entry-header" onclick="toggleEntry('exp-body-${entry.id}')"><span class="entry-title">${entry.jobTitle || 'New Experience'}</span><div class="entry-actions"><button class="btn-remove" onclick="removeEntry('experience', ${entry.id}, 'exp-${entry.id}')">×</button></div></div><div class="entry-body" id="exp-body-${entry.id}"><div class="form-group"><label>Job Title</label><input type="text" value="${entry.jobTitle}" oninput="updateEntry('experience', ${entry.id}, 'jobTitle', this.value)"></div><div class="form-row"><div class="form-group"><label>Company</label><input type="text" value="${entry.company}" oninput="updateEntry('experience', ${entry.id}, 'company', this.value)"></div><div class="form-group"><label>Location</label><input type="text" value="${entry.location}" oninput="updateEntry('experience', ${entry.id}, 'location', this.value)"></div></div><div class="form-row"><div class="form-group"><label>Start Date</label><input type="text" value="${entry.startDate}" oninput="updateEntry('experience', ${entry.id}, 'startDate', this.value)"></div><div class="form-group"><label>End Date</label><input type="text" value="${entry.endDate}" oninput="updateEntry('experience', ${entry.id}, 'endDate', this.value)"></div></div><div class="form-group"><label>Responsibilities (Each new line = Bullet)</label><textarea oninput="updateEntry('experience', ${entry.id}, 'bullets', this.value)">${entry.bullets}</textarea></div></div></div>`;
    document.getElementById('experience-list').insertAdjacentHTML('beforeend', html);
}

function createEducationEntry(data = null) {
    const id = Date.now() + Math.random();
    const entry = data || { id, degree: '', institution: '', startYear: '', endYear: '', gpa: '', courses: '' };
    if (!data) cvData.education.push(entry);
    const html = `<div class="dynamic-entry" id="edu-${entry.id}"><div class="entry-header" onclick="toggleEntry('edu-body-${entry.id}')"><span class="entry-title">${entry.degree || 'New Education'}</span><div class="entry-actions"><button class="btn-remove" onclick="removeEntry('education', ${entry.id}, 'edu-${entry.id}')">×</button></div></div><div class="entry-body" id="edu-body-${entry.id}"><div class="form-group"><label>Degree</label><input type="text" value="${entry.degree}" oninput="updateEntry('education', ${entry.id}, 'degree', this.value)"></div><div class="form-group"><label>Institution</label><input type="text" value="${entry.institution}" oninput="updateEntry('education', ${entry.id}, 'institution', this.value)"></div><div class="form-row"><div class="form-group"><label>Start Year</label><input type="text" value="${entry.startYear}" oninput="updateEntry('education', ${entry.id}, 'startYear', this.value)"></div><div class="form-group"><label>End Year</label><input type="text" value="${entry.endYear}" oninput="updateEntry('education', ${entry.id}, 'endYear', this.value)"></div></div><div class="form-row"><div class="form-group"><label>GPA</label><input type="text" value="${entry.gpa}" oninput="updateEntry('education', ${entry.id}, 'gpa', this.value)"></div><div class="form-group"><label>Coursework</label><input type="text" value="${entry.courses}" oninput="updateEntry('education', ${entry.id}, 'courses', this.value)"></div></div></div></div>`;
    document.getElementById('education-list').insertAdjacentHTML('beforeend', html);
}

function createProjectEntry(data = null) {
    const id = Date.now() + Math.random();
    const entry = data || { id, name: '', stack: '', description: '' };
    if (!data) cvData.projects.push(entry);
    const html = `<div class="dynamic-entry" id="proj-${entry.id}"><div class="entry-header" onclick="toggleEntry('proj-body-${entry.id}')"><span class="entry-title">${entry.name || 'New Project'}</span><div class="entry-actions"><button class="btn-remove" onclick="removeEntry('projects', ${entry.id}, 'proj-${entry.id}')">×</button></div></div><div class="entry-body" id="proj-body-${entry.id}"><div class="form-group"><label>Name</label><input type="text" value="${entry.name}" oninput="updateEntry('projects', ${entry.id}, 'name', this.value)"></div><div class="form-group"><label>Stack</label><input type="text" value="${entry.stack}" oninput="updateEntry('projects', ${entry.id}, 'stack', this.value)"></div><div class="form-group"><label>Description</label><textarea oninput="updateEntry('projects', ${entry.id}, 'description', this.value)">${entry.description}</textarea></div></div></div>`;
    document.getElementById('projects-list').insertAdjacentHTML('beforeend', html);
}

function createLanguageEntry(data = null) {
    const id = Date.now() + Math.random();
    const entry = data || { id, name: '', level: 'Fluent' };
    if (!data) cvData.skills.languages.push(entry);
    const html = `<div class="skill-row" id="lang-${entry.id}"><input type="text" value="${entry.name}" style="flex:2" oninput="updateSkillEntry('languages', ${entry.id}, 'name', this.value)"><select style="flex:1" onchange="updateSkillEntry('languages', ${entry.id}, 'level', this.value)"><option ${entry.level==='Native'?'selected':''}>Native</option><option ${entry.level==='Fluent'?'selected':''}>Fluent</option><option ${entry.level==='Intermediate'?'selected':''}>Intermediate</option><option ${entry.level==='Basic'?'selected':''}>Basic</option></select><button class="btn-remove" onclick="removeSkillEntry('languages', ${entry.id}, 'lang-${entry.id}')">×</button></div>`;
    document.getElementById('languages-list').insertAdjacentHTML('beforeend', html);
}

function createExtraEntry(type, data = null) {
    const id = Date.now() + Math.random();
    const listId = type === 'certifications' ? 'certs-list' : 'awards-list';
    const prefix = type === 'certifications' ? 'cert' : 'award';
    const entry = data || (type === 'certifications' ? { id, name: '', org: '', year: '' } : { id, title: '', desc: '' });
    if (!data) cvData.extras[type].push(entry);
    const body = type === 'certifications' ? `<div class="form-row"><div class="form-group" style="flex:2"><label>Name</label><input type="text" value="${entry.name}" oninput="updateExtraEntry('${type}', ${entry.id}, 'name', this.value)"></div><div class="form-group" style="flex:1"><label>Year</label><input type="text" value="${entry.year}" oninput="updateExtraEntry('${type}', ${entry.id}, 'year', this.value)"></div></div><div class="form-group"><label>Org</label><input type="text" value="${entry.org}" oninput="updateExtraEntry('${type}', ${entry.id}, 'org', this.value)"></div>` : `<div class="form-group"><label>Title</label><input type="text" value="${entry.title}" oninput="updateExtraEntry('${type}', ${entry.id}, 'title', this.value)"></div><div class="form-group"><label>Desc</label><input type="text" value="${entry.desc}" oninput="updateExtraEntry('${type}', ${entry.id}, 'desc', this.value)"></div>`;
    const html = `<div class="dynamic-entry" id="${prefix}-${entry.id}"><div class="entry-body">${body}<button class="btn-remove" onclick="removeExtraEntry('${type}', ${entry.id}, '${prefix}-${entry.id}')">Remove Item</button></div></div>`;
    document.getElementById(listId).insertAdjacentHTML('beforeend', html);
}

// ─── SECTION: ENTRY HELPERS ───
function toggleEntry(id) { document.getElementById(id).classList.toggle('collapsed'); }
function updateEntry(t, id, k, v) { 
    const e = cvData[t].find(x => x.id === id); 
    if (e) { 
        e[k] = v; 
        const h = document.querySelector(`#${t.slice(0,3)}-${id} .entry-title`);
        if (h && (k==='jobTitle'||k==='degree'||k==='name')) h.innerText = v || 'New Item';
        debouncedRender(); debouncedSave(); 
    } 
}
function updateExtraEntry(t, id, k, v) { const e = cvData.extras[t].find(x => x.id === id); if (e) { e[k] = v; debouncedRender(); debouncedSave(); } }
function updateSkillEntry(t, id, k, v) { const e = cvData.skills[t].find(x => x.id === id); if (e) { e[k] = v; debouncedRender(); debouncedSave(); } }
function removeEntry(t, id, el) { cvData[t] = cvData[t].filter(x => x.id !== id); document.getElementById(el).remove(); debouncedRender(); debouncedSave(); }
function removeExtraEntry(t, id, el) { cvData.extras[t] = cvData.extras[t].filter(x => x.id !== id); document.getElementById(el).remove(); debouncedRender(); debouncedSave(); }
function removeSkillEntry(t, id, el) { cvData.skills[t] = cvData.skills[t].filter(x => x.id !== id); document.getElementById(el).remove(); debouncedRender(); debouncedSave(); }

// ─── SECTION: TAG INPUTS ───
function setupTagInput(inputId, containerId, path) {
    const input = document.getElementById(inputId), container = document.getElementById(containerId);
    const render = () => {
        const parts = path.split('.');
        const tags = parts.length === 2 ? cvData[parts[0]][parts[1]] : cvData.extras[parts[1]];
        container.querySelectorAll('.tag-pill').forEach(p => p.remove());
        tags.forEach(t => {
            const p = document.createElement('div'); p.className = 'tag-pill'; p.innerHTML = `${t} <span class="remove-tag">×</span>`;
            p.querySelector('.remove-tag').onclick = () => { tags.splice(tags.indexOf(t), 1); render(); debouncedRender(); debouncedSave(); };
            container.insertBefore(p, input);
        });
    };
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); const val = input.value.trim().replace(/,$/, '');
            const parts = path.split('.'); const tags = parts.length === 2 ? cvData[parts[0]][parts[1]] : cvData.extras[parts[1]];
            if (val && !tags.includes(val)) { tags.push(val); render(); debouncedRender(); debouncedSave(); input.value = ''; }
        } else if (e.key === 'Backspace' && input.value === '') {
            const parts = path.split('.'); const tags = parts.length === 2 ? cvData[parts[0]][parts[1]] : cvData.extras[parts[1]];
            tags.pop(); render(); debouncedRender(); debouncedSave();
        }
    });
    setTimeout(render, 0);
}

// ─── SECTION: PREVIEW RENDERER ───
function renderPreview() {
    const template = cvData.template;
    previewEl.className = `template-${template}`;
    const hasData = cvData.personal.name || cvData.personal.title || cvData.summary.text || cvData.experience.length > 0;
    if (!hasData) {
        previewEl.innerHTML = `<div class="preview-empty"><p>Start filling the form to see your CV preview</p></div>`;
        return;
    }

    let bodyHtml = '';
    if (template === 'classic') {
        bodyHtml = `
            <div class="classic-header">
                <h1>${cvData.personal.name || 'Your Name'}</h1>
                <div class="job-title">${cvData.personal.title || ''}</div>
                <div class="classic-contact">
                    ${cvData.personal.email ? `<span>✉ ${cvData.personal.email}</span>` : ''}
                    ${cvData.personal.phone ? `<span>✆ ${cvData.personal.phone}</span>` : ''}
                    ${cvData.personal.location ? `<span>📍 ${cvData.personal.location}</span>` : ''}
                </div>
            </div>
            <div class="classic-body">
                ${renderSec('SUMMARY', `<p style="font-size:13px; line-height:1.6">${cvData.summary.text}</p>`, cvData.summary.text)}
                ${renderSec('EXPERIENCE', cvData.experience.map(exp => `
                    <div class="cv-item">
                        <div class="classic-exp-item"><strong>${exp.company}</strong><span>${exp.startDate} - ${exp.endDate || 'Present'}</span></div>
                        <div style="font-style:italic; font-size:13px; color:#555">${exp.jobTitle}</div>
                        <ul class="classic-bullets">${exp.bullets.split('\n').filter(b => b.trim()).map(b => `<li>${b.trim()}</li>`).join('')}</ul>
                    </div>
                `).join(''), cvData.experience.length)}
                ${renderSec('SKILLS', `<div class="classic-skills-grid">${cvData.skills.technical.map(s => `<div class="classic-skill-tag">${s}</div>`).join('')}${cvData.skills.soft.map(s => `<div class="classic-skill-tag" style="border-color:#777; color:#777">${s}</div>`).join('')}</div>`, cvData.skills.technical.length + cvData.skills.soft.length)}
                ${renderSec('EDUCATION', cvData.education.map(edu => `<div class="cv-item"><strong>${edu.institution}</strong> • ${edu.degree} (${edu.startYear}-${edu.endYear})</div>`).join(''), cvData.education.length)}
            </div>`;
    } else if (template === 'warm') {
        bodyHtml = `
            <div class="warm-sidebar">
                ${cvData.personal.photo ? `<div class="warm-photo"><img src="${cvData.personal.photo}"></div>` : ''}
                <div class="warm-name">${cvData.personal.name}</div>
                <div class="cv-section">
                    <div class="cv-section-title">CONTACT</div>
                    <div class="warm-contact-list">
                        ${cvData.personal.email ? `<div>✉ ${cvData.personal.email}</div>` : ''}
                        ${cvData.personal.phone ? `<div>✆ ${cvData.personal.phone}</div>` : ''}
                        ${cvData.personal.location ? `<div>📍 ${cvData.personal.location}</div>` : ''}
                    </div>
                </div>
                <div class="cv-section">
                    <div class="cv-section-title">SKILLS</div>
                    ${cvData.skills.technical.map(s => `<span class="warm-skill-tag">${s}</span>`).join('')}
                </div>
            </div>
            <div class="warm-main">
                ${renderSec('SUMMARY', `<p style="font-size:14px; line-height:1.7">${cvData.summary.text}</p>`, cvData.summary.text)}
                ${renderSec('EXPERIENCE', cvData.experience.map(exp => `
                    <div class="cv-item">
                        <div class="warm-exp-header"><strong>${exp.company}</strong><span>${exp.startDate}-${exp.endDate||'Now'}</span></div>
                        <div class="warm-title">${exp.jobTitle}</div>
                        <ul style="padding-left:20px; font-size:13px; margin-top:8px">${exp.bullets.split('\n').filter(b=>b.trim()).map(b=>`<li>${b.trim()}</li>`).join('')}</ul>
                    </div>
                `).join(''), cvData.experience.length)}
            </div>`;
    } else {
        bodyHtml = `
            <div class="clean-header">
                <div class="clean-name">${cvData.personal.name}</div>
                <div class="clean-title">${cvData.personal.title}</div>
                <div class="clean-contact">${cvData.personal.email} • ${cvData.personal.phone} • ${cvData.personal.location}</div>
            </div>
            ${renderSec('Experience', cvData.experience.map(exp => `
                <div class="cv-item">
                    <div style="display:flex; justify-content:space-between"><strong>${exp.company}</strong><span>${exp.startDate}-${exp.endDate||'Present'}</span></div>
                    <div style="font-size:14px">${exp.jobTitle}</div>
                    <ul style="padding-left:20px; font-size:13.5px">${exp.bullets.split('\n').filter(b=>b.trim()).map(b=>`<li>${b.trim()}</li>`).join('')}</ul>
                </div>
            `).join(''), cvData.experience.length)}
            ${renderSec('Skills', `<div style="font-size:14px"><strong>Technical:</strong> ${cvData.skills.technical.join(', ')}<br><strong>Soft:</strong> ${cvData.skills.soft.join(', ')}</div>`, cvData.skills.technical.length)}`;
    }

    previewEl.innerHTML = bodyHtml;
    const isOverflow = previewEl.scrollHeight > previewEl.clientHeight;
    overflowWarning.style.display = isOverflow ? 'block' : 'none';
}

function renderSec(title, content, cond) { if (!cond) return ''; return `<section class="cv-section"><h2 class="cv-section-title">${title}</h2>${content}</section>`; }
function debouncedRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderPreview, 50); }

// ─── SECTION: STORAGE & EXPORT ───
function debouncedSave() { 
    clearTimeout(saveTimer); 
    saveTimer = setTimeout(() => { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData)); 
        saveIndicator.classList.add('show'); 
        setTimeout(() => saveIndicator.classList.remove('show'), 1500); 
    }, 500); 
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        cvData = JSON.parse(saved);
        document.getElementById('p-name').value = cvData.personal.name || '';
        document.getElementById('p-title').value = cvData.personal.title || '';
        document.getElementById('p-email').value = cvData.personal.email || '';
        document.getElementById('p-phone').value = cvData.personal.phone || '';
        document.getElementById('p-location').value = cvData.personal.location || '';
        document.getElementById('p-summary').value = cvData.summary.text || '';
        if (cvData.personal.photo) document.getElementById('photo-preview').innerHTML = `<img src="${cvData.personal.photo}">`;
        cvData.experience.forEach(createExperienceEntry);
        cvData.education.forEach(createEducationEntry);
        cvData.projects.forEach(createProjectEntry);
        cvData.skills.languages.forEach(createLanguageEntry);
        cvData.extras.certifications.forEach(c => createExtraEntry('certifications', c));
        cvData.extras.achievements.forEach(a => createExtraEntry('achievements', a));
    }
    debouncedRender(); updateDownloadState();
}

templatePicker.addEventListener('click', (e) => {
    const b = e.target.closest('.template-btn'); if (!b) return;
    cvData.template = b.dataset.template;
    document.querySelectorAll('.template-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    previewEl.style.opacity = '0';
    setTimeout(() => { renderPreview(); previewEl.style.opacity = '1'; debouncedSave(); }, 50);
});

downloadBtn.addEventListener('click', () => {
    downloadBtn.disabled = true; downloadBtn.innerText = "Generating PDF...";
    const fn = cvData.personal.name ? `${cvData.personal.name.replace(/\s+/g, '-')}-Resume.pdf` : 'Resume.pdf';
    html2pdf().set({ margin: 10, filename: fn, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(previewEl).save().then(() => { downloadBtn.disabled = false; downloadBtn.innerText = "Download PDF"; });
});

clearBtn.onclick = () => { if (confirm('Clear all?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); } };
function updateDownloadState() { downloadBtn.disabled = !cvData.personal.name.trim(); }

// ─── SECTION: INITIALIZE ───
document.getElementById('add-experience').onclick = () => createExperienceEntry();
document.getElementById('add-education').onclick = () => createEducationEntry();
document.getElementById('add-project').onclick = () => createProjectEntry();
document.getElementById('add-language').onclick = () => createLanguageEntry();
document.getElementById('add-cert').onclick = () => createExtraEntry('certifications');
document.getElementById('add-award').onclick = () => createExtraEntry('achievements');

setupTagInput('tech-skill-input', 'tech-skills-container', 'skills.technical');
setupTagInput('soft-skill-input', 'soft-skills-container', 'skills.soft');
setupTagInput('interest-input', 'interests-container', 'extras.interests');

window.onresize = () => { const s = Math.min(1, (document.querySelector('.preview-panel').clientWidth - 80) / 794); document.getElementById('preview-wrapper').style.transform = `scale(${s})`; };
loadData(); window.onresize();
