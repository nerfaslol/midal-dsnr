// TO MIDÃO DSNR — arquivo midal
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  members: [],
  musicas: [],
  musicasByFile: {},
  glossario: [],
  memes: [],
  videos: [
    { id: '0MnQdyjgFY8', title: '9' },
    { id: '9Pig8iB5wek', title: 'O TREM MAIS CARO' },
    { id: 'o9G-RVzMRbg', title: 'Wiz Khalifa - See You Again ft. Charlie Puth [COMPILADO TO MIDAS]' },
    { id: 'Tvs0T4vUn8I', title: 'Rock Lee vs Gaara [MIDAS VERSION]' }
  ],
  currentIdx: -1,
  filteredMembers: [],
  memberFilter: 'todos',
  groupMode: 'all',
  volume: 0.8,
  shuffle: false,
  repeat: 'off',  // off, one, all
  shuffleQueue: [],
};

// ===== THEME TOGGLE =====
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}
(function initTheme() {
  const saved = localStorage.getItem('midal-theme');
  if (saved === 'light') applyTheme('light');
})();
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('#theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('midal-theme', next);
  });
});

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
function memberMatchesFilter(m, filter) {
  if (filter === 'todos') return true;
  if (filter === 'admin') return m.isAdmin;
  if (filter === 'ativo') return m.status === 'ativo' || m.status === 'operador';
  if (filter === 'lendario') return m.status === 'lendario';
  if (filter === 'ex-membro') return m.status === 'ex-membro';
  if (filter === 'discog') return (m.discografiaArtist?.length || m.discografiaTheme?.length);
  return true;
}

function renderMembers() {
  const grid = $('#members-grid');
  state.filteredMembers = state.members.filter(m => memberMatchesFilter(m, state.memberFilter));

  grid.innerHTML = state.filteredMembers.map((m, _idx) => {
    const realIdx = state.members.indexOf(m);
    const photo = m.photo
      ? `<img src="${m.photo}" alt="${escapeHtml(m.apelido)}" class="member-photo" loading="lazy" onerror="this.outerHTML='<div class=\\'member-photo placeholder\\'>${initials(m.apelido)}</div>'" />`
      : `<div class="member-photo placeholder">${initials(m.apelido)}</div>`;
    const badgeText = m.status === 'lendario' ? 'lendário'
      : m.status === 'ex-membro' ? 'ex'
      : m.status === 'operador' ? 'op'
      : '';
    const badge = badgeText ? `<span class="badge">${badgeText}</span>` : '';
    const adminBadge = m.isAdmin ? `<span class="admin-badge">admin</span>` : '';
    const realName = m.nome && m.nome !== m.apelido ? `<p class="member-real">${escapeHtml(m.nome)}</p>` : '';
    const pins = [];
    const dCount = (m.discografiaArtist?.length || 0) + (m.discografiaTheme?.length || 0);
    if (dCount) pins.push(`<span class="pin">${dCount}♪</span>`);
    if (m.glossarioRelated?.length) pins.push(`<span class="pin">${m.glossarioRelated.length}#</span>`);
    return `
      <article class="member status-${m.status} ${m.isAdmin ? 'is-admin' : ''}" data-idx="${realIdx}" tabindex="0" role="button" aria-label="abrir ficha de ${escapeHtml(m.apelido)}">
        ${adminBadge}
        ${badge}
        ${photo}
        <h3 class="member-name">${escapeHtml(m.apelido)}</h3>
        ${realName}
        <p class="member-bio">${escapeHtml(m.bio || '')}</p>
        <div class="member-meta">${pins.join('')}</div>
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

$$('#member-filters .filter-chip').forEach(b => {
  b.addEventListener('click', () => {
    $$('#member-filters .filter-chip').forEach(x => x.classList.toggle('active', x === b));
    state.memberFilter = b.dataset.filter;
    renderMembers();
  });
});

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
  let statusLabel;
  let statusClass;
  if (m.status === 'lendario') { statusLabel = 'ex-membro · lendário'; statusClass = 'lendario'; }
  else if (m.status === 'ex-membro') { statusLabel = 'ex-membro'; statusClass = 'ex-membro'; }
  else if (m.status === 'operador') { statusLabel = 'operador do bot'; statusClass = 'operador'; }
  else if (m.isAdmin) { statusLabel = 'admin do grupo · ativo'; statusClass = 'admin'; }
  else if (m.confirmed === false) { statusLabel = 'identidade pendente'; statusClass = ''; }
  else { statusLabel = 'membro ativo'; statusClass = ''; }
  statusEl.className = `modal-status ${statusClass}`;
  statusEl.textContent = statusLabel;

  const aliasesEl = $('#modal-aliases');
  const aliases = (m.apelidos || []).filter(a => a && a !== m.apelido);
  aliasesEl.innerHTML = aliases.map(a => `<span class="alias">${escapeHtml(a)}</span>`).join('');

  // mood
  const moodSec = $('#modal-mood-section');
  if (m.mood) {
    $('#modal-mood-text').textContent = m.mood;
    moodSec.classList.remove('empty');
  } else {
    moodSec.classList.add('empty');
  }

  $('#modal-bio').textContent = m.bio || 'sem bio catalogada ainda';

  // recent topics
  const topicsEl = $('#modal-topics');
  const topicsSec = $('#modal-topics-section');
  if (m.recentTopics?.length) {
    topicsEl.innerHTML = m.recentTopics.map(t => `<span class="chip topic">${escapeHtml(t)}</span>`).join('');
    topicsSec.classList.remove('empty');
  } else {
    topicsSec.classList.add('empty');
  }

  // events
  const eventsEl = $('#modal-events');
  const eventsSec = $('#modal-events-section');
  if (m.memorableEvents?.length) {
    eventsEl.innerHTML = m.memorableEvents.map(e => `<li>${escapeHtml(e)}</li>`).join('');
    eventsSec.classList.remove('empty');
  } else {
    eventsSec.classList.add('empty');
  }

  // discografia
  const discogSec = $('#modal-discog-section');
  const artistWrap = $('#modal-discog-artist-wrap');
  const themeWrap = $('#modal-discog-theme-wrap');
  const artistEl = $('#modal-discog-artist');
  const themeEl = $('#modal-discog-theme');
  const songRow = (file) => {
    const s = state.musicasByFile[file];
    if (!s) return '';
    return `<li data-file="${escapeHtml(file)}"><span class="play-icon" aria-hidden="true">▸</span><span>${escapeHtml(s.titulo)}</span><span class="dur">${fmtDur(s.duracao_s)}</span></li>`;
  };
  if (m.discografiaArtist?.length) {
    artistEl.innerHTML = m.discografiaArtist.map(songRow).join('');
    artistWrap.classList.remove('empty');
  } else {
    artistWrap.classList.add('empty');
  }
  if (m.discografiaTheme?.length) {
    themeEl.innerHTML = m.discografiaTheme.map(songRow).join('');
    themeWrap.classList.remove('empty');
  } else {
    themeWrap.classList.add('empty');
  }
  const hasDiscog = (m.discografiaArtist?.length || 0) + (m.discografiaTheme?.length || 0);
  discogSec.classList.toggle('empty', hasDiscog === 0);
  $$('.modal-songs li', discogSec).forEach(li => {
    li.addEventListener('click', () => playByFile(li.dataset.file));
  });

  // termos
  const termsEl = $('#modal-terms');
  const termsSec = $('#modal-terms-section');
  if (m.glossarioRelated?.length) {
    termsEl.innerHTML = m.glossarioRelated.map(t => `<button class="chip" data-term="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
    termsSec.classList.remove('empty');
    $$('.chip', termsEl).forEach(c => c.addEventListener('click', () => openGlossModal(c.dataset.term)));
  } else {
    termsSec.classList.add('empty');
  }

  // memes
  const memesEl = $('#modal-memes');
  const memesSec = $('#modal-memes-section');
  if (m.memesRelated?.length) {
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
    if ($('#video-modal').classList.contains('open')) closeVideoModal();
    else if ($('#lyrics-panel').classList.contains('open')) closeLyrics();
    else if ($('#gloss-backdrop').classList.contains('open')) closeGlossModal();
    else if ($('#modal-backdrop').classList.contains('open')) closeMemberModal();
  }
});

// ===== MÚSICAS =====
$$('#tabs .tab[data-tab="musicas"]').forEach(() => {}); // noop

$$('.music-group-toggle .group-btn').forEach(b => {
  b.addEventListener('click', () => {
    $$('.music-group-toggle .group-btn').forEach(x => x.classList.toggle('active', x === b));
    state.groupMode = b.dataset.group;
    renderMusic($('#music-search').value);
  });
});

function renderMusic(filter = '') {
  const wrap = $('#music-list-wrap');
  const f = filter.toLowerCase().trim();
  const filtered = !f ? state.musicas : state.musicas.filter(m =>
    m.titulo.toLowerCase().includes(f) || (m.transcricao || '').toLowerCase().includes(f)
  );
  const currentFile = state.musicas[state.currentIdx]?.file;
  const renderItem = m => `
    <li class="music-item ${m.file === currentFile ? 'playing' : ''}" data-file="${escapeHtml(m.file)}">
      <div class="title-wrap">
        <span class="play-icon" aria-hidden="true">▸</span>
        <span class="t-text">${escapeHtml(m.titulo)}</span>
      </div>
      <span class="dur">${fmtDur(m.duracao_s)}</span>
    </li>
  `;

  if (state.groupMode === 'artist') {
    // group by artistLabel
    const groups = new Map();
    const noArtist = [];
    for (const m of filtered) {
      if (m.artistKey && m.artistLabel) {
        if (!groups.has(m.artistLabel)) groups.set(m.artistLabel, []);
        groups.get(m.artistLabel).push(m);
      } else {
        noArtist.push(m);
      }
    }
    // sort groups by count desc
    const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    let html = '';
    for (const [label, songs] of sortedGroups) {
      html += `
        <div class="artist-section">
          <h3>${escapeHtml(label)} <span class="count">${songs.length} faixa${songs.length === 1 ? '' : 's'}</span></h3>
          <ul class="music-list">${songs.map(renderItem).join('')}</ul>
        </div>
      `;
    }
    if (noArtist.length) {
      html += `
        <div class="artist-section">
          <h3>outros <span class="count">${noArtist.length} faixa${noArtist.length === 1 ? '' : 's'}</span></h3>
          <ul class="music-list">${noArtist.map(renderItem).join('')}</ul>
        </div>
      `;
    }
    wrap.innerHTML = html || `<p style="color:var(--fg-dim);">nada por aqui...</p>`;
  } else {
    wrap.innerHTML = `<ul class="music-list">${filtered.map(renderItem).join('') || '<li class="music-item" style="cursor:default;">nada por aqui...</li>'}</ul>`;
  }

  $$('.music-item[data-file]', wrap).forEach(li => {
    li.addEventListener('click', () => playByFile(li.dataset.file));
  });
  $('#music-count').textContent = `${filtered.length} de ${state.musicas.length} faixas`;
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
  $('#pb-label').textContent = m.artistLabel ? `rádio midas — ${m.artistLabel}` : 'rádio midas — tocando';
  $('#pb-dur').textContent = fmtDur(m.duracao_s);
  $('#pb-cur').textContent = '0:00';
  $('#pb-progress-fill').style.width = '0%';

  // enable lyrics button if transcription exists
  const lyrBtn = $('#pb-lyrics');
  if (m.transcricao && m.transcricao.length > 4) {
    lyrBtn.disabled = false;
    if ($('#lyrics-panel').classList.contains('open')) updateLyrics(m);
  } else {
    lyrBtn.disabled = true;
    closeLyrics();
  }

  updateMusicHighlight();
  updateNavButtons();
}

function updateMusicHighlight() {
  const file = state.musicas[state.currentIdx]?.file;
  $$('.music-item').forEach(li => li.classList.toggle('playing', li.dataset.file === file));
  $$('.modal-songs li').forEach(li => li.classList.toggle('playing', li.dataset.file === file));
}

function updateNavButtons() {
  $('#pb-prev').disabled = state.musicas.length === 0;
  $('#pb-next').disabled = state.musicas.length === 0;
}

function pickNextIdx() {
  if (state.repeat === 'one') return state.currentIdx;
  if (state.shuffle) {
    // refill shuffleQueue if empty
    if (state.shuffleQueue.length === 0) {
      const pool = state.musicas.map((_, i) => i).filter(i => i !== state.currentIdx);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      state.shuffleQueue = pool;
    }
    return state.shuffleQueue.shift();
  }
  const next = state.currentIdx + 1;
  if (next >= state.musicas.length) {
    return state.repeat === 'all' ? 0 : -1;
  }
  return next;
}
function pickPrevIdx() {
  if (state.repeat === 'one') return state.currentIdx;
  if (state.shuffle) {
    return state.shuffleQueue.length ? state.shuffleQueue.pop() : state.currentIdx;
  }
  const p = state.currentIdx - 1;
  if (p < 0) return state.repeat === 'all' ? state.musicas.length - 1 : 0;
  return p;
}

// player controls
const audio = $('#audio');
const playBtn = $('#pb-play');
const prevBtn = $('#pb-prev');
const nextBtn = $('#pb-next');
const shuffleBtn = $('#pb-shuffle');
const repeatBtn = $('#pb-repeat');
const progBar = $('#pb-progress');
const progFill = $('#pb-progress-fill');
const playerBar = $('#player-bar');

playBtn.addEventListener('click', () => {
  if (state.currentIdx < 0 && state.musicas.length) {
    playByIdx(state.shuffle ? Math.floor(Math.random() * state.musicas.length) : 0);
    return;
  }
  if (audio.paused) audio.play(); else audio.pause();
});

prevBtn.addEventListener('click', () => {
  if (audio.currentTime > 4) { audio.currentTime = 0; return; }
  const idx = pickPrevIdx();
  if (idx >= 0) playByIdx(idx);
});
nextBtn.addEventListener('click', () => {
  const idx = pickNextIdx();
  if (idx >= 0) playByIdx(idx);
});

shuffleBtn.addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  state.shuffleQueue = [];
  shuffleBtn.classList.toggle('active', state.shuffle);
});

const REPEAT_CYCLE = ['off', 'all', 'one'];
const repeatBadge = $('#pb-repeat-badge');
repeatBtn.addEventListener('click', () => {
  const i = REPEAT_CYCLE.indexOf(state.repeat);
  state.repeat = REPEAT_CYCLE[(i + 1) % REPEAT_CYCLE.length];
  repeatBtn.classList.toggle('active', state.repeat !== 'off');
  repeatBtn.classList.toggle('repeat-one', state.repeat === 'one');
  if (repeatBadge) repeatBadge.hidden = state.repeat !== 'one';
  repeatBtn.title = `repeat: ${state.repeat}`;
});

audio.addEventListener('play', () => { playerBar.classList.add('playing'); });
audio.addEventListener('pause', () => { playerBar.classList.remove('playing'); });
audio.addEventListener('ended', () => {
  const idx = pickNextIdx();
  if (idx >= 0) playByIdx(idx);
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
const volWrap = volIcon.parentElement;
function updateVolIcon() {
  const lvl = audio.volume === 0 ? 'mute' : audio.volume < 0.5 ? 'mid' : 'high';
  volWrap.setAttribute('data-vol', lvl);
}
volSlider.addEventListener('input', e => {
  state.volume = parseInt(e.target.value, 10) / 100;
  audio.volume = state.volume;
  updateVolIcon();
});
volIcon.addEventListener('click', () => {
  if (audio.volume > 0) {
    state.volume = 0;
    audio.volume = 0;
    volSlider.value = 0;
  } else {
    state.volume = 0.8;
    audio.volume = 0.8;
    volSlider.value = 80;
  }
  updateVolIcon();
});

// keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space' && state.currentIdx >= 0) {
    e.preventDefault();
    if (audio.paused) audio.play(); else audio.pause();
  }
  if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); const idx = pickNextIdx(); if (idx >= 0) playByIdx(idx);
  }
  if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); const idx = pickPrevIdx(); if (idx >= 0) playByIdx(idx);
  }
});

$('#music-search').addEventListener('input', e => renderMusic(e.target.value));

// ===== LYRICS PANEL =====
const lyrBtn = $('#pb-lyrics');
const lyrPanel = $('#lyrics-panel');
function openLyrics() {
  const m = state.musicas[state.currentIdx];
  if (!m || !m.transcricao) return;
  updateLyrics(m);
  lyrPanel.classList.add('open');
  lyrBtn.classList.add('active');
}
function closeLyrics() {
  lyrPanel.classList.remove('open');
  lyrBtn.classList.remove('active');
}
function updateLyrics(m) {
  $('#lyrics-title').textContent = m.titulo;
  // transcricao tem pouco quebra de linha; quebrar por frases
  const body = m.transcricao
    .replace(/\.\s+/g, '.\n')
    .replace(/([!?])\s+/g, '$1\n')
    .replace(/\s{2,}/g, '\n');
  $('#lyrics-body').textContent = body;
}
lyrBtn.addEventListener('click', () => {
  if (lyrBtn.disabled) return;
  if (lyrPanel.classList.contains('open')) closeLyrics();
  else openLyrics();
});
$('#lyrics-close').addEventListener('click', closeLyrics);

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

// ===== VÍDEOS =====
function renderVideos() {
  const grid = $('#video-grid');
  if (!grid) return;
  grid.innerHTML = state.videos.map((v, idx) => `
    <article class="video-card" data-idx="${idx}" role="button" tabindex="0" aria-label="tocar ${escapeHtml(v.title)}">
      <div class="video-thumb">
        <img src="https://i.ytimg.com/vi/${escapeHtml(v.id)}/hqdefault.jpg"
             alt="${escapeHtml(v.title)}"
             loading="lazy"
             referrerpolicy="no-referrer" />
        <span class="video-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </span>
      </div>
      <h3>${escapeHtml(v.title)}</h3>
    </article>
  `).join('');

  $$('.video-card', grid).forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    card.addEventListener('click', () => openVideoModal(idx));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideoModal(idx); }
    });
  });
}

// ===== VIDEO MODAL =====
const videoModal = $('#video-modal');
const videoIframeWrap = $('#video-iframe-wrap');
const videoModalTitle = $('#video-modal-title');
const videoModalYt = $('#video-modal-yt');

function openVideoModal(idx) {
  const v = state.videos[idx];
  if (!v) return;
  // pausa rádio se estiver tocando, evita áudio sobreposto
  if (!audio.paused) audio.pause();
  const url = `https://www.youtube.com/embed/${encodeURIComponent(v.id)}?autoplay=1&modestbranding=1&rel=0&playsinline=1`;
  videoIframeWrap.innerHTML = `<iframe src="${url}" title="${escapeHtml(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  videoModalTitle.textContent = v.title;
  videoModalYt.href = `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeVideoModal() {
  videoModal.classList.remove('open');
  videoIframeWrap.innerHTML = '';  // mata o iframe pra parar o vídeo
  document.body.style.overflow = '';
}
$('#video-modal-close').addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideoModal(); });

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
    state.musicasByFile = Object.fromEntries(musicas.map(m => [m.file, m]));
    state.glossario = glossario;
    state.memes = memes;
    audio.volume = state.volume;
    renderMembers();
    renderMusic();
    renderGlossario();
    renderMemes();
    renderVideos();
    updateNavButtons();
  } catch (e) {
    console.error('load failed', e);
    $('#members-grid').innerHTML = `<p style="color:var(--danger);">erro ao carregar dados midais</p>`;
  }
}
load();
