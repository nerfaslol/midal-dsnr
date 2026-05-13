// TO MIDÃO DSNR — arquivo midal
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  members: [],
  musicas: [],
  glossario: [],
  memes: [],
  currentSong: null
};

// ===== TABS =====
$$('.tab').forEach(t => {
  t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('active', x === t));
    const tab = t.dataset.tab;
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ===== HELPERS =====
function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
}
function fmtDur(s) {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ===== MEMBROS =====
function renderMembers() {
  const grid = $('#members-grid');
  grid.innerHTML = state.members.map(m => {
    const photo = m.photo
      ? `<img src="${m.photo}" alt="${m.apelido}" class="member-photo" loading="lazy" onerror="this.outerHTML='<div class=\\'member-photo placeholder\\'>${initials(m.apelido)}</div>'" />`
      : `<div class="member-photo placeholder">${initials(m.apelido)}</div>`;
    const aliases = m.apelidos.filter(a => a !== m.apelido).slice(0, 3)
      .map(a => `<span class="alias">${a}</span>`).join('');
    const badgeText = m.status === 'lendario' ? 'lendário'
      : m.status === 'ex-membro' ? 'ex'
      : m.status === 'operador' ? 'op'
      : '';
    const badge = badgeText ? `<span class="badge">${badgeText}</span>` : '';
    const realName = m.nome && m.nome !== m.apelido && !m.nome.includes('pendente') ? m.nome : '';
    return `
      <article class="member status-${m.status}">
        ${badge}
        ${photo}
        <h3 class="member-name">${m.apelido}</h3>
        ${realName ? `<p class="member-real">${realName}</p>` : ''}
        <div class="member-aliases">${aliases}</div>
        <p class="member-bio">${m.bio || ''}</p>
      </article>
    `;
  }).join('');
  $('#member-count').textContent = state.members.length;
}

// ===== MÚSICAS =====
function renderMusic(filter = '') {
  const list = $('#music-list');
  const f = filter.toLowerCase().trim();
  const filtered = !f ? state.musicas : state.musicas.filter(m =>
    m.titulo.toLowerCase().includes(f) || (m.transcricao || '').toLowerCase().includes(f)
  );
  list.innerHTML = filtered.map(m => `
    <li class="music-item" data-file="${m.file}">
      <span><span class="play-icon">▶</span> ${m.titulo}</span>
      <span class="dur">${fmtDur(m.duracao_s)}</span>
    </li>
  `).join('') || `<li class="music-item" style="cursor:default;">nada por aqui...</li>`;
  $$('.music-item[data-file]', list).forEach(li => {
    li.addEventListener('click', () => playSong(li.dataset.file));
  });
  $('#music-count').textContent = `${filtered.length} de ${state.musicas.length} faixas`;
  $('#song-count').textContent = state.musicas.length;
}

function playSong(file) {
  const m = state.musicas.find(x => x.file === file);
  if (!m) return;
  state.currentSong = m;
  const audio = $('#audio');
  audio.src = `audio/${encodeURIComponent(file)}`;
  audio.play().catch(e => console.warn('autoplay block:', e));
  $('#now-title').textContent = m.titulo;
  $('#now-lyrics').textContent = m.transcricao || '(sem letra transcrita)';
  $$('.music-item').forEach(li => li.classList.toggle('playing', li.dataset.file === file));
  $('#player').classList.add('playing');
  // scroll player into view if mobile
  if (window.innerWidth < 700) {
    $('#player').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

$('#audio').addEventListener('pause', () => $('#player').classList.remove('playing'));
$('#audio').addEventListener('play', () => $('#player').classList.add('playing'));
$('#audio').addEventListener('ended', () => {
  // next song
  const idx = state.musicas.findIndex(x => x.file === state.currentSong?.file);
  if (idx >= 0 && idx + 1 < state.musicas.length) playSong(state.musicas[idx + 1].file);
});

$('#music-search').addEventListener('input', (e) => renderMusic(e.target.value));

// ===== GLOSSÁRIO =====
function renderGlossario(filter = '') {
  const f = filter.toLowerCase().trim();
  const filtered = !f ? state.glossario : state.glossario.filter(g =>
    g.termo.toLowerCase().includes(f) || g.significado.toLowerCase().includes(f)
  );
  $('#glossario').innerHTML = filtered.map(g => `
    <div class="gloss">
      <h3>${g.termo}</h3>
      <p>${g.significado}</p>
      ${g.exemplo ? `<p class="ex">${g.exemplo}</p>` : ''}
    </div>
  `).join('') || `<p style="color:var(--fg-dim);">nada encontrado</p>`;
}
$('#gloss-search').addEventListener('input', (e) => renderGlossario(e.target.value));

// ===== MEMES =====
function renderMemes() {
  $('#memes-grid').innerHTML = state.memes.map(m => `
    <article class="meme">
      <h3>${m.titulo}</h3>
      <p>${m.descricao}</p>
    </article>
  `).join('');
}

// ===== LOAD =====
async function load() {
  try {
    const [members, musicas, glossario, memes] = await Promise.all([
      fetch('data/members.json').then(r => r.json()),
      fetch('data/musicas.json').then(r => r.json()),
      fetch('data/glossario.json').then(r => r.json()),
      fetch('data/memes.json').then(r => r.json())
    ]);
    state.members = members.members;
    state.musicas = musicas;
    state.glossario = glossario;
    state.memes = memes;
    renderMembers();
    renderMusic();
    renderGlossario();
    renderMemes();
  } catch (e) {
    console.error('load failed', e);
    $('#members-grid').innerHTML = `<p style="color:var(--danger);">erro ao carregar dados midais</p>`;
  }
}
load();
