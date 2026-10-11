'use strict';
/* Main menu, new-game setup, engine settings, ideas board, localization and FPS counter.
   Loaded BEFORE game.js: it defines plist() and startScreen(), game.js calls startScreen() once the map is drawn.
   The world map itself (already rendered on the canvas) is the menu background; #mm only dims it. */
const LANGS = { ru: 'Русский', en: 'English', zh: '中文', es: 'Español', de: 'Deutsch', fr: 'Français' };
const I18N = {
  ru: { title: 'ВЕЛИКАЯ ВОЙНА', sub: 'Реальная карта мира. Выбери державу и добейся господства над 30% провинций.', play: 'Играть', settings: 'Настройки', ideas: 'Предложения', exit: 'Выход', back: 'Назад',
    prepTitle: 'Настройки новой партии', country: 'Страна', search: 'Поиск страны…', pick: 'Выбери страну', playAs: 'Играть за {c}', prov: 'пров.',
    buy: 'Покупка территорий', yes: 'Да', no: 'Нет', diff: 'Сложность', d0: 'Легко', d1: 'Средне', d2: 'Хардкор', diffHint: 'Покупка территорий и сложность фиксируются на старте и не меняются во время партии.',
    saves: 'Сохранения', load: 'Загрузить', turn: 'ход', slot: 'слот', auto: 'авто',
    setTitle: 'Настройки', fps: 'Счётчик FPS', fpsHint: 'Показывать кадры в секунду в углу экрана', lang: 'Язык', langHint: 'Переведены меню и кнопки; игровой текст пока на русском.',
    ideasTitle: 'Доска предложений', ideasHint: 'Идеи хранятся локально в этом браузере. Ставь лайки лучшим.', ideaPh: 'Твоя идея для игры…', add: 'Добавить', del: 'Удалить', none: 'Пока пусто. Предложи первую идею!', like: 'Нравится',
    exitAsk: 'Выйти из игры?', exitHint: 'Эту вкладку нельзя закрыть автоматически. Закрой её вручную.' },
  en: { title: 'THE GREAT WAR', sub: 'The real world map. Pick a power and take control of 30% of all provinces.', play: 'Play', settings: 'Settings', ideas: 'Suggestions', exit: 'Exit', back: 'Back',
    prepTitle: 'New game setup', country: 'Country', search: 'Search country…', pick: 'Pick a country', playAs: 'Play as {c}', prov: 'prov.',
    buy: 'Buying territories', yes: 'Yes', no: 'No', diff: 'Difficulty', d0: 'Easy', d1: 'Normal', d2: 'Hardcore', diffHint: 'Territory buying and difficulty are fixed at the start and cannot change during the game.',
    saves: 'Saved games', load: 'Load', turn: 'turn', slot: 'slot', auto: 'auto',
    setTitle: 'Settings', fps: 'FPS counter', fpsHint: 'Show frames per second in the corner of the screen', lang: 'Language', langHint: 'Menus and buttons are translated; in-game text is still Russian.',
    ideasTitle: 'Suggestion board', ideasHint: 'Ideas are stored locally in this browser. Like the best ones.', ideaPh: 'Your idea for the game…', add: 'Add', del: 'Delete', none: 'Nothing yet. Post the first idea!', like: 'Like',
    exitAsk: 'Quit the game?', exitHint: 'This tab cannot be closed automatically. Please close it manually.' },
  zh: { title: '世界大战', sub: '真实的世界地图。选择一个国家，控制30%的省份。', play: '开始游戏', settings: '设置', ideas: '建议', exit: '退出', back: '返回',
    prepTitle: '新游戏设置', country: '国家', search: '搜索国家…', pick: '请选择国家', playAs: '扮演 {c}', prov: '省',
    buy: '购买领土', yes: '是', no: '否', diff: '难度', d0: '简单', d1: '普通', d2: '硬核', diffHint: '购买领土和难度在开局时确定，游戏中无法更改。',
    saves: '存档', load: '读取', turn: '回合', slot: '槽位', auto: '自动',
    setTitle: '设置', fps: 'FPS 计数器', fpsHint: '在屏幕角落显示每秒帧数', lang: '语言', langHint: '菜单和按钮已翻译；游戏内文本暂时为俄语。',
    ideasTitle: '建议板', ideasHint: '想法保存在此浏览器本地。给最好的点赞。', ideaPh: '你对游戏的想法…', add: '添加', del: '删除', none: '还没有内容，发布第一个想法吧！', like: '点赞',
    exitAsk: '退出游戏？', exitHint: '无法自动关闭此标签页，请手动关闭。' },
  es: { title: 'LA GRAN GUERRA', sub: 'El mapa real del mundo. Elige una potencia y controla el 30% de las provincias.', play: 'Jugar', settings: 'Ajustes', ideas: 'Sugerencias', exit: 'Salir', back: 'Atrás',
    prepTitle: 'Nueva partida', country: 'País', search: 'Buscar país…', pick: 'Elige un país', playAs: 'Jugar con {c}', prov: 'prov.',
    buy: 'Compra de territorios', yes: 'Sí', no: 'No', diff: 'Dificultad', d0: 'Fácil', d1: 'Normal', d2: 'Extrema', diffHint: 'La compra de territorios y la dificultad se fijan al inicio y no cambian durante la partida.',
    saves: 'Partidas guardadas', load: 'Cargar', turn: 'turno', slot: 'ranura', auto: 'auto',
    setTitle: 'Ajustes', fps: 'Contador de FPS', fpsHint: 'Mostrar los fotogramas por segundo en una esquina', lang: 'Idioma', langHint: 'Menús y botones traducidos; el texto del juego sigue en ruso.',
    ideasTitle: 'Tablón de sugerencias', ideasHint: 'Las ideas se guardan localmente en este navegador. Da «me gusta» a las mejores.', ideaPh: 'Tu idea para el juego…', add: 'Añadir', del: 'Borrar', none: 'Aún no hay nada. ¡Publica la primera idea!', like: 'Me gusta',
    exitAsk: '¿Salir del juego?', exitHint: 'Esta pestaña no se puede cerrar automáticamente. Ciérrala manualmente.' },
  de: { title: 'DER GROSSE KRIEG', sub: 'Die echte Weltkarte. Wähle eine Macht und kontrolliere 30% aller Provinzen.', play: 'Spielen', settings: 'Einstellungen', ideas: 'Vorschläge', exit: 'Beenden', back: 'Zurück',
    prepTitle: 'Neues Spiel', country: 'Land', search: 'Land suchen…', pick: 'Land wählen', playAs: 'Als {c} spielen', prov: 'Prov.',
    buy: 'Gebietskauf', yes: 'Ja', no: 'Nein', diff: 'Schwierigkeit', d0: 'Leicht', d1: 'Normal', d2: 'Hardcore', diffHint: 'Gebietskauf und Schwierigkeit werden zu Beginn festgelegt und lassen sich im Spiel nicht ändern.',
    saves: 'Spielstände', load: 'Laden', turn: 'Zug', slot: 'Slot', auto: 'auto',
    setTitle: 'Einstellungen', fps: 'FPS-Anzeige', fpsHint: 'Bilder pro Sekunde in der Ecke anzeigen', lang: 'Sprache', langHint: 'Menüs und Schaltflächen sind übersetzt; der Spieltext ist noch Russisch.',
    ideasTitle: 'Vorschlagsbrett', ideasHint: 'Ideen werden lokal in diesem Browser gespeichert. Bewerte die besten.', ideaPh: 'Deine Idee für das Spiel…', add: 'Hinzufügen', del: 'Löschen', none: 'Noch nichts. Poste die erste Idee!', like: 'Gefällt mir',
    exitAsk: 'Spiel beenden?', exitHint: 'Dieser Tab kann nicht automatisch geschlossen werden. Bitte manuell schließen.' },
  fr: { title: 'LA GRANDE GUERRE', sub: 'La vraie carte du monde. Choisis une puissance et contrôle 30 % des provinces.', play: 'Jouer', settings: 'Paramètres', ideas: 'Suggestions', exit: 'Quitter', back: 'Retour',
    prepTitle: 'Nouvelle partie', country: 'Pays', search: 'Rechercher un pays…', pick: 'Choisis un pays', playAs: 'Jouer {c}', prov: 'prov.',
    buy: 'Achat de territoires', yes: 'Oui', no: 'Non', diff: 'Difficulté', d0: 'Facile', d1: 'Moyen', d2: 'Hardcore', diffHint: 'L’achat de territoires et la difficulté sont fixés au départ et ne changent pas pendant la partie.',
    saves: 'Parties sauvegardées', load: 'Charger', turn: 'tour', slot: 'emplacement', auto: 'auto',
    setTitle: 'Paramètres', fps: 'Compteur FPS', fpsHint: 'Afficher les images par seconde dans un coin de l’écran', lang: 'Langue', langHint: 'Menus et boutons traduits ; le texte du jeu reste en russe.',
    ideasTitle: 'Tableau de suggestions', ideasHint: 'Les idées sont stockées localement dans ce navigateur. Aime les meilleures.', ideaPh: 'Ton idée pour le jeu…', add: 'Ajouter', del: 'Supprimer', none: 'Rien pour l’instant. Poste la première idée !', like: 'J’aime',
    exitAsk: 'Quitter le jeu ?', exitHint: 'Cet onglet ne peut pas être fermé automatiquement. Ferme-le manuellement.' }
};

var PREP = { buy: true, dif: 1 };   // chosen on the setup screen; applied once in start() and then frozen

const Menu = (() => {
  const LS = 'gw.settings.v1', IDEAS = 'gw.ideas.v1';
  const st = { lang: 'ru', fps: false };
  try { Object.assign(st, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { /* storage unavailable */ }
  if (!I18N[st.lang]) st.lang = 'ru';
  let cur = 'main', raf = 0, frames = 0, last = 0;

  const g = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* storage unavailable */ } };
  const t = (k, v) => { let s = (I18N[st.lang] && I18N[st.lang][k]) || I18N.ru[k] || k; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };
  const HEART = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.3 10.6 20C5.4 15.3 2 12.2 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.7-3.4 6.8-8.6 11.5z"/></svg>';
  const ARROW = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>';

  /** Country name in the chosen language (Intl.DisplayNames by ISO code); Russian names come from the game data. */
  const dn = {};
  function cname(o) {
    if (st.lang === 'ru') return K[o][0];
    try { const d = dn[st.lang] || (dn[st.lang] = new Intl.DisplayNames([st.lang], { type: 'region' })), n = d.of(K[o][1]); return n && n !== K[o][1] ? n : K[o][0]; } catch (e) { return K[o][0]; }
  }

  const head = (title, back) => '<div class="ch">' + (back ? '<button class="btn ico" onclick="Menu.show(\'main\')" aria-label="' + esc(t('back')) + '">' + ARROW + '</button>' : '') + '<div class="ttl grow">' + esc(title) + '</div></div>';
  const sw = (id, on, handler) => '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + ' onchange="' + handler + '"><span></span></label>';

  const views = {
    main: () => '<div class="hero mm-hero"><h1>' + esc(t('title')) + '</h1><p>' + esc(t('sub')) + '</p></div><div class="mm-btns">' +
      '<button class="btn mm-btn pri" onclick="Menu.show(\'prep\')">' + I('play') + '<span>' + esc(t('play')) + '</span></button>' +
      '<button class="btn mm-btn" onclick="Menu.show(\'settings\')">' + I('list') + '<span>' + esc(t('settings')) + '</span></button>' +
      '<button class="btn mm-btn" onclick="Menu.show(\'ideas\')">' + I('star') + '<span>' + esc(t('ideas')) + '</span></button>' +
      '<button class="btn mm-btn dng" onclick="Menu.exit()">' + I('close') + '<span>' + esc(t('exit')) + '</span></button></div>',

    prep: () => {
      const sv = ['a', 1, 2, 3].filter(s => slotMeta(s));
      return '<div class="mm-box">' + head(t('prepTitle'), true) +
        '<div class="sec">' + esc(t('country')) + '</div><input id="pq" type="text" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '" oninput="pq=this.value;plist()"><div id="plist" class="plist"></div>' +
        '<div class="panel row"><span class="grow">' + esc(t('buy')) + '</span><b id="pbuyv">' + esc(t(PREP.buy ? 'yes' : 'no')) + '</b>' + sw('pbuy', PREP.buy, 'Menu.setBuy(this.checked)') + '</div>' +
        '<div class="sec">' + esc(t('diff')) + '</div><div class="seg" id="pdif">' + [0, 1, 2].map(i => '<button class="btn ' + (PREP.dif === i ? 'on' : '') + '" onclick="Menu.setDif(' + i + ')">' + esc(t('d' + i)) + '</button>').join('') + '</div>' +
        '<div class="mut" style="margin:6px 0 10px">' + esc(t('diffHint')) + '</div>' +
        '<div class="row"><button id="pgo" class="btn pri wide" onclick="start()"></button></div>' +
        (sv.length ? '<div class="sec">' + esc(t('saves')) + '</div>' + sv.map(s => { const i = slotMeta(s); return '<div class="panel row" style="margin-top:0"><span class="grow">' + i.f + ' ' + esc(i.n) + '<br><small>' + esc(t('turn')) + ' ' + i.t + (s === 'a' ? ' · ' + esc(t('auto')) : ' · ' + esc(t('slot')) + ' ' + s) + '</small></span><button class="btn" onclick="loadFrom(\'' + s + '\')">' + esc(t('load')) + '</button></div>'; }).join('') : '') + '</div>';
    },

    settings: () => '<div class="mm-box">' + head(t('setTitle'), true) +
      '<div class="panel row"><span class="grow">' + esc(t('fps')) + '<br><small>' + esc(t('fpsHint')) + '</small></span>' + sw('sfps', st.fps, 'Menu.setFps(this.checked)') + '</div>' +
      '<div class="panel row"><span class="grow">' + esc(t('lang')) + '<br><small>' + esc(t('langHint')) + '</small></span><select id="slang" aria-label="' + esc(t('lang')) + '" onchange="Menu.setLang(this.value)">' +
      Object.keys(LANGS).map(c => '<option value="' + c + '"' + (c === st.lang ? ' selected' : '') + '>' + LANGS[c] + '</option>').join('') + '</select></div></div>',

    ideas: () => {
      const a = readIdeas().sort((x, y) => y.likes - x.likes || y.ts - x.ts);
      return '<div class="mm-box">' + head(t('ideasTitle'), true) + '<div class="mut" style="margin-bottom:8px">' + esc(t('ideasHint')) + '</div>' +
        '<div class="row"><input id="idea" type="text" maxlength="200" placeholder="' + esc(t('ideaPh')) + '" aria-label="' + esc(t('ideaPh')) + '" class="grow" onkeydown="if(event.key===\'Enter\')Menu.addIdea()"><button class="btn pri" onclick="Menu.addIdea()">' + esc(t('add')) + '</button></div>' +
        '<div class="ideas">' + (a.length ? a.map(i => '<div class="idea"><button class="like ' + (i.liked ? 'on' : '') + '" onclick="Menu.like(\'' + i.id + '\')" aria-label="' + esc(t('like')) + '" aria-pressed="' + !!i.liked + '">' + HEART + '<b>' + i.likes + '</b></button><span class="grow">' + esc(i.text) + '</span><button class="btn ico" onclick="Menu.delIdea(\'' + i.id + '\')" aria-label="' + esc(t('del')) + '">' + I('close') + '</button></div>').join('') : '<div class="mut" style="text-align:center;padding:14px">' + esc(t('none')) + '</div>') + '</div></div>';
    }
  };

  function show(scr) {
    cur = scr;
    const m = g('mm'); m.style.display = 'flex'; m.innerHTML = views[scr]();
    if (scr === 'prep') { plist(); const se = document.querySelector('#plist .pi.on'); if (se) se.scrollIntoView({ block: 'center' }); }
  }
  const hide = () => { const m = g('mm'); if (m) m.style.display = 'none'; };

  /* ----- new game parameters (fixed on start) ----- */
  function setBuy(v) { PREP.buy = !!v; const l = g('pbuyv'); if (l) l.textContent = t(PREP.buy ? 'yes' : 'no'); }
  function setDif(i) { PREP.dif = i; document.querySelectorAll('#pdif button').forEach((b, k) => b.classList.toggle('on', k === i)); }

  /* ----- engine settings ----- */
  function loop(ts) {
    frames++;
    if (ts - last >= 500) {
      const f = Math.round(frames * 1000 / (ts - last)), el = g('fps');
      el.textContent = f + ' FPS'; el.className = f >= 50 ? 'good' : f >= 30 ? 'mid' : 'bad'; frames = 0; last = ts;
    }
    raf = requestAnimationFrame(loop);
  }
  function setFps(on) {
    st.fps = !!on; save();
    const el = g('fps'); el.style.display = st.fps ? 'block' : 'none';
    cancelAnimationFrame(raf);
    if (st.fps) { frames = 0; last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function setLang(c) {
    if (!I18N[c]) return;
    st.lang = c; save(); document.documentElement.lang = c;
    if (g('mm').style.display !== 'none') show(cur);
  }

  /* ----- ideas board (localStorage + likes) ----- */
  function readIdeas() { try { return JSON.parse(localStorage.getItem(IDEAS) || '[]'); } catch (e) { return []; } }
  function writeIdeas(a) { try { localStorage.setItem(IDEAS, JSON.stringify(a)); } catch (e) { /* storage unavailable */ } }
  function addIdea() {
    const inp = g('idea'), v = inp ? inp.value.trim().slice(0, 200) : '';
    if (!v) return;
    const a = readIdeas(); a.push({ id: Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36), text: v, likes: 0, liked: false, ts: Date.now() });
    writeIdeas(a); show('ideas'); const n = g('idea'); if (n) n.focus();
  }
  function like(id) { const a = readIdeas(), i = a.find(x => x.id === id); if (!i) return; i.liked = !i.liked; i.likes = Math.max(0, i.likes + (i.liked ? 1 : -1)); writeIdeas(a); show('ideas'); }
  function delIdea(id) { writeIdeas(readIdeas().filter(x => x.id !== id)); show('ideas'); }

  /* ----- exit: close the tab if the browser allows it, otherwise stay on the start screen ----- */
  function exit() {
    if (!confirm(t('exitAsk'))) return;
    window.close();
    setTimeout(() => { if (!window.closed) { show('main'); msg(t('exitHint')); } }, 250);
  }

  document.documentElement.lang = st.lang;
  document.addEventListener('DOMContentLoaded', () => { if (st.fps) setFps(true); });
  if (document.readyState !== 'loading' && st.fps) setFps(true);

  return { show, hide, t, cname, setBuy, setDif, setFps, setLang, addIdea, like, delIdea, exit, state: st };
})();

/* Country list on the setup screen: flags, localized names, search in both languages. */
function plist() {
  const q = pq.toLowerCase(), l = K.map((k, j) => [j, cnt(j)]).filter(x => x[1] > 0 && (!q || Menu.cname(x[0]).toLowerCase().includes(q) || K[x[0]][0].toLowerCase().includes(q))).sort((a, b) => K[b[0]][3] - K[a[0]][3]);
  $('plist').innerHTML = l.map(x => '<button class="pi ' + (x[0] == PK ? 'on' : '') + '" onclick="PK=' + x[0] + ';plist()"><span class="flg">' + fl(x[0]) + '</span><span class="grow"><b>' + Menu.cname(x[0]) + '</b><small>' + fG(K[x[0]][3]) + ' · ' + x[1] + ' ' + Menu.t('prov') + '</small></span></button>').join('');
  $('pgo').disabled = PK < 0;
  $('pgo').innerHTML = PK < 0 ? '<span>' + Menu.t('pick') + '</span>' : I('play') + '<span>' + Menu.t('playAs', { c: Menu.cname(PK) }) + '</span>';
}

/* The map is already drawn behind the menu; show the main menu on top of it. */
function startScreen() {
  PK = K.findIndex(k => k[0] == 'Люксембург'); if (PK < 0 || !cnt(PK)) PK = K.findIndex(k => k[0] == 'Германия');
  pq = '';
  Menu.show('main');
}
