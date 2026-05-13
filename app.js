// TO MIDÃO DSNR — arquivo midal
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  members: [],
  musicas: [],
  glossario: [],
  memes: [],
  currentIdx: -1,
  filteredMusicas: [],
  volume: 0.8,
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
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== MEMBROS =====
function renderMembers() {
  const grid = $('#members-grid');
  grid.innerHTML = state.members.map((m, idx) => {
    const photo = m.photo
      ? `<img src="${m.photo}" alt="${escapeHtml(m.apelido)}" class="member-photo" loading="lazy" onerror="this.outerHTML='<div class=\\'member-photo placeholder\\'>${initials(m.apelido)}</div>'" />`
      : `<div class="member-photo placeholder">${initials(m.apelido)}</div>`;
    const badgeText = m.status === 'lendario' ? 'lendário'
      : m.status === 'ex-membro' ? 'ex'
      : m.status === 'operador' ? 'op'
      : '';
    const badge = badgeText ? `<span class="badge">${badgeText}</span>` : '';
    const realName = m.nome && m.nome !== m.apelido ? `<p class="member-real">${escapeHtml(m.nome)}</p>` : '';
    return `
      <article class="member status-${m.status}" data-idx="${idx}" tabindex="0" role="button" aria-label="abrir ficha de ${escapeHtml(m.apelido)}">
        ${badge}
        ${photo}
        <h3 class="member-name">${escapeHtml(m.apelido)}</h3>
        ${realName}
        <p class="member-bio">${escapeHtml(m.bio || '')}</p>
      </article>
    `;
  }).join('');
  $$('.member', grid).forEach(card => {
    card.addEventListener('click', () => openMemberModal(parseInt(card.dataset.idx, 10)));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMemberModal(parseInt(card.dataset.idx, 10));
      }
    });
  });
  $('#member-count').textContent = state.members.length;
}

// ===== MEMBER MODAL =====
function openMemberModal(idx) {
  const m = state.members[idx];
  if (!m) return;
  const photo = $('#modal-photo');
  if (m.photo) {
    photo.style.backgroundImage = `url('${m.photo}')`;
    photo.classList.remove('placeholder');
    photo.textContent = '';
  } else {
    photo.style.backgroundImage = '';
    photo.classList.add('placeholder');
    photo.textContent = initials(m.apelido);
  }
  $('#modal-apelido').textContent = m.apelido;
  const realEl = $('#modal-real');
  if (m.nome && m.nome !== m.apelido) {
    realEl.textContent = m.nome;
    realEl.style.display = '';
  } else {
    realEl.style.display = 'none';
  }
  const statusEl = $('#modal-status');
  statusEl.className = `modal-status ${m.status}`;
  statusEl.textContent = m.status === 'lendario' ? 'ex-membro · lendário'
    : m.status === 'ex-membro' ? 'ex-membro'
    : m.status === 'operador' ? 'operador do bot'
    : m.confirmed === false ? 'identidade pendente' : 'membro ativo';
  const aliasesEl = $('#modal-aliases');
  const aliases = (m.apelidos || []).filter(a => a && a !== m.apelido);
  aliasesEl.innerHTML = aliases.map(a => `<span class="alias">${escapeHtml(a)}</span>`).join('');
  $('#modal-bio').textContent = m.bio || 'sem bio catalogada ainda';

  // termos relacionados
  const termsEl = $('#modal-terms');
  const termsSec = $('#modal-terms-section');
  if (m.glossarioRelated && m.glossarioRelated.length) {
    termsEl.innerHTML = m.glossarioRelated.map(t => `<button class="chip" data-term="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
    termsSec.classList.remove('empty');
    $$('.chip', termsEl).forEach(c => c.addEventListener('click', () => openGlossModal(c.dataset.term)));
  } else {
    termsSec.classList.add('empty');
  }

  // memes relacionados
  const memesEl = $('#modal-memes');
  const memesSec = $('#modal-memes-section');
  if (m.memesRelated && m.memesRelated.length) {
    memesEl.innerHTML = m.memesRelated.map(t => `<span class="chip meme">${escapeHtml(t)}</span>`).join('');
    memesSec.classList.remove('empty');
  } else {
    memesSec.classList.add('empty');
  }

  $('#modal-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMemberModal() {
  $('#modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function openGlossModal(termo) {
  const g = state.glossario.find(x => x.termo === termo);
  if (!g) return;
  $('#gloss-termo').textContent = g.termo;
  $('#gloss-sig').textContent = g.significado;
  const ex = $('#gloss-ex');
  if (g.exemplo) { ex.textContent = g.exemplo; ex.style.display = ''; }
  else ex.style.display = 'none';
  $('#gloss-backdrop').classList.add('open');
}
function closeGlossModal() {
  $('#gloss-backdrop').classList.remove('open');
}

$('#modal-close').addEventListener('click', closeMemberModal);
$('#modal-backdrop').addEventListener('click', e => { if (e.target === $('#modal-backdrop')) closeMemberModal(); });
$('#gloss-close').addEventListener('click', closeGlossModal);
$('#gloss-backdrop').addEventListener('click', e => { if (e.target === $('#gloss-backdrop')) closeGlossModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#gloss-backdrop').classList.contains('open')) closeGlossModal();
    else if ($('#modal-backdrop').classList.contains('open')) closeMemberModal();
  }
});

// ===== MÚSICAS =====
function renderMusic(filter = '') {
  const list = $('#music-list');
  const f = filter.toLowerCase().trim();
  state.filteredMusicas = !f ? state.musicas : state.musicas.filter(m =>
    m.titulo.toLowerCase().includes(f) || (m.transcricao || '').toLowerCase().includes(f)
  );
  const currentFile = state.musicas[state.currentIdx]?.file;
  list.innerHTML = state.filteredMusicas.map(m => `
    <li class="music-item ${m.file === currentFile ? 'playing' : ''}" data-file="${escapeHtml(m.file)}">
      <div class="title-wrap">
        <span class="play-icon">▶</span>
        <span class="t-text">${escapeHtml(m.titulo)}</span>
      </div>
      <span class="dur">${fmtDur(m.duracao_s)}</span>
    </li>
  `).join('') || `<li class="music-item" style="cursor:default;">nada por aqui...</li>`;
  $$('.music-item[data-file]', list).forEach(li => {
    li.addEventListener('click', () => playByFile(li.dataset.file));
  });
  $('#music-count').textContent = `${state.filteredMusicas.length} de ${state.musicas.length} faixas`;
  $('#song-count').textContent = state.musicas.length;
}

function playByFile(file) {
  const idx = state.musicas.findIndex(m => m.file === file);
  if (idx < 0) return;
  playByIdx(idx);
}

function playByIdx(idx) {
  if (idx < 0 || idx >= state.musicas.length) return;
  state.currentIdx = idx;
  const m = state.musicas[idx];
  const audio = $('#audio');
  audio.src = `audio/${encodeURIComponent(m.file)}`;
  audio.volume = state.volume;
  audio.play().catch(e => console.warn('play err', e));
  $('#pb-title').textContent = m.titulo;
  $('#pb-label').textContent = 'rádio midas — tocando';
  $('#pb-dur').textContent = fmtDur(m.duracao_s);
  $('#pb-cur').textContent = '0:00';
  $('#pb-progress-fill').style.width = '0%';
  updateMusicHighlight();
  updateNavButtons();
}

function updateMusicHighlight() {
  const file = state.musicas[state.currentIdx]?.file;
  $$('.music-item').forEach(li => li.classList.toggle('playing', li.dataset.file === file));
}

function updateNavButtons() {
  $('#pb-prev').disabled = state.currentIdx <= 0;
  $('#pb-next').disabled = state.currentIdx < 0 || state.currentIdx >= state.musicas.length - 1;
}

// player controls
const audio = $('#audio');
const playBtn = $('#pb-play');
const prevBtn = $('#pb-prev');
const nextBtn = $('#pb-next');
const progBar = $('#pb-progress');
const progFill = $('#pb-progress-fill');
const playerBar = $('#player-bar');

playBtn.addEventListener('click', () => {
  if (state.currentIdx < 0 && state.musicas.length) {
    playByIdx(0);
    return;
  }
  if (audio.paused) audio.play(); else audio.pause();
});

prevBtn.addEventListener('click', () => playByIdx(state.currentIdx - 1));
nextBtn.addEventListener('click', () => playByIdx(state.currentIdx + 1));

audio.addEventListener('play', () => { playBtn.textContent = '⏸'; playerBar.classList.add('playing'); });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; playerBar.classList.remove('playing'); });
audio.addEventListener('ended', () => {
  if (state.currentIdx < state.musicas.length - 1) playByIdx(state.currentIdx + 1);
});
audio.addEventListener('timeupdate', () => {
  if (audio.duration && isFinite(audio.duration)) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progFill.style.width = pct + '%';
    $('#pb-cur').textContent = fmtDur(audio.currentTime);
  }
});
audio.addEventListener('loadedmetadata', () => {
  $('#pb-dur').textContent = fmtDur(audio.duration);
});
audio.addEventListener('error', () => {
  $('#pb-title').textContent = 'erro ao carregar faixa';
  $('#pb-label').textContent = 'rádio midas — erro';
});

progBar.addEventListener('click', e => {
  if (!audio.duration || !isFinite(audio.duration)) return;
  const rect = progBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

// volume
const volSlider = $('#pb-vol');
const volIcon = $('#pb-vol-icon');
volSlider.addEventListener('input', e => {
  state.volume = parseInt(e.target.value, 10) / 100;
  audio.volume = state.volume;
  volIcon.textContent = state.volume === 0 ? '🔇' : state.volume < 0.5 ? '🔉' : '🔊';
});
volIcon.addEventListener('click', () => {
  if (audio.volume > 0) {
    state.volume = 0;
    audio.volume = 0;
    volSlider.value = 0;
    volIcon.textContent = '🔇';
  } else {
    state.volume = 0.8;
    audio.volume = 0.8;
    volSlider.value = 80;
    volIcon.textContent = '🔊';
  }
});

// keyboard: space toggles play
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space' && state.currentIdx >= 0) {
    e.preventDefault();
    if (audio.paused) audio.play(); else audio.pause();
  }
});

$('#music-search').addEventListener('input', e => renderMusic(e.target.value));

// ===== GLOSSÁRIO =====
function renderGlossario(filter = '') {
  const f = filter.toLowerCase().trim();
  const filtered = !f ? state.glossario : state.glossario.filter(g =>
    g.termo.toLowerCase().includes(f) || g.significado.toLowerCase().includes(f)
  );
  $('#glossario').innerHTML = filtered.map(g => `
    <div class="gloss">
      <h3>${escapeHtml(g.termo)}</h3>
      <p>${escapeHtml(g.significado)}</p>
      ${g.exemplo ? `<p class="ex">${escapeHtml(g.exemplo)}</p>` : ''}
    </div>
  `).join('') || `<p style="color:var(--fg-dim);">nada encontrado</p>`;
}
$('#gloss-search').addEventListener('input', e => renderGlossario(e.target.value));

// ===== MEMES =====
function renderMemes() {
  $('#memes-grid').innerHTML = state.memes.map(m => `
    <article class="meme">
      <h3>${escapeHtml(m.titulo)}</h3>
      <p>${escapeHtml(m.descricao)}</p>
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
    audio.volume = state.volume;
    renderMembers();
    renderMusic();
    renderGlossario();
    renderMemes();
    updateNavButtons();
  } catch (e) {
    console.error('load failed', e);
    $('#members-grid').innerHTML = `<p style="color:var(--danger);">erro ao carregar dados midais</p>`;
  }
}
load();
