/* =========================================================
   DATA — content for each exhibit
   ========================================================= */
const DATA = {
  process: {
    icon: "⚙️",
    accent: "#22d3ee",
    title: "Process Management",
    tag: "One CPU · many programs",
    desc: "Every program you open becomes one or more <b>processes</b>. Process management keeps track of all of them, decides which one gets the CPU next and for how long, and switches between them so fast that everything feels like it is running at the same time.",
    analogy: "A single chef with five orders. The chef starts a dish, and while it simmers, switches to the next one — then comes back. Nothing burns, and everybody gets fed.",
    example: "Press <b>Ctrl + Shift + Esc</b> on Windows to open Task Manager → <i>Processes</i>. Chrome, Spotify and Word are all listed as running at once on a 4-core CPU. The OS is scheduling them hundreds of times per second."
  },
  file: {
    icon: "🗂️",
    accent: "#a78bfa",
    title: "File Management",
    tag: "Everything has a place",
    desc: "File management organises your data into <b>files</b> and <b>folders</b>. It records where each file lives on the disk, and handles creating, reading, renaming, moving and deleting them — so you never have to think about the hardware underneath.",
    analogy: "A huge library with a card catalogue. The books (files) sit on shelves (folders), and the catalogue tells the librarian exactly which shelf to walk to.",
    example: "You save <b>holiday.jpg</b> into <i>Pictures\\2024\\</i>. The OS writes the name, size, location and permissions into the file system (NTFS on Windows, APFS on macOS, ext4 on Linux) so it can find it again months later."
  },
  memory: {
    icon: "🧠",
    accent: "#34d399",
    title: "Memory Management",
    tag: "Space for everyone",
    desc: "Memory management hands out <b>RAM</b> to each running program, keeps programs from overwriting each other's data, and takes the memory back when a program closes. It also creates <b>virtual memory</b>, so programs can use more than is physically installed.",
    analogy: "A hotel receptionist assigning rooms. Every guest gets their own room and key — and nobody can wander into someone else's room.",
    example: "Open 30 Chrome tabs on an 8 GB laptop. Each tab runs in its own protected memory space. When RAM runs low, the OS quietly swaps older pages to the disk (<i>page file</i> on Windows, <i>swap</i> on Linux/macOS)."
  },
  security: {
    icon: "🔐",
    accent: "#fb7185",
    title: "Security Management",
    tag: "Who is allowed to do that?",
    desc: "Security management decides <b>who</b> is allowed to do <b>what</b>. It authenticates users, then enforces permissions on files, memory, the CPU and hardware devices — so an ordinary app cannot quietly read your passwords or wipe your drive.",
    analogy: "A building with a security guard and keycards. Your card opens the front door and your office; only the manager's card opens the server room.",
    example: "Windows shows <b>“Do you want to allow this app to make changes?”</b> (UAC) before installing software. On macOS and Linux, file permissions like <code>chmod 755</code> control exactly who can read, write or execute a file."
  }
};

/* =========================================================
   OVERLAY CONTROL
   ========================================================= */
const overlay  = document.getElementById('overlay');
const panel    = document.getElementById('panel');
const closeBtn = document.getElementById('closeBtn');
const demoArea = document.getElementById('demoArea');

let demoTimer = null;

function stopDemo(){
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
}

function openExhibit(key){
  const d = DATA[key];
  if (!d) return;

  document.documentElement.style.setProperty('--accent', d.accent);

  document.getElementById('ovIcon').textContent  = d.icon;
  document.getElementById('ovTitle').textContent = d.title;
  document.getElementById('ovTag').textContent   = d.tag;
  document.getElementById('ovDesc').innerHTML    = d.desc;
  document.getElementById('ovAnalogy').innerHTML = d.analogy;
  document.getElementById('ovExample').innerHTML = d.example;

  stopDemo();
  demoArea.innerHTML = '';
  DEMOS[key](demoArea);

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panel.scrollTop = 0;
}

function closeExhibit(){
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  stopDemo();
}

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => openExhibit(card.dataset.key));
});

closeBtn.addEventListener('click', closeExhibit);
overlay.addEventListener('click', e => { if (e.target === overlay) closeExhibit(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('show')) closeExhibit();
});

/* =========================================================
   DEMO 1 — PROCESS SCHEDULER (round robin)
   ========================================================= */
function processDemo(root){
  const procs = [
    { icon:'🎵', name:'Music Player', progress:0 },
    { icon:'🌐', name:'Web Browser',  progress:0 },
    { icon:'📥', name:'File Download',progress:0 },
    { icon:'🎮', name:'Game',         progress:0 }
  ];

  root.innerHTML = `
    <div class="cpu">
      <div class="cpu-label"><span>CPU Core</span><b id="cpuNow">booting…</b></div>
      <div class="cpu-track"></div>
    </div>
    <div class="procs" id="procs"></div>
    <p style="margin-top:14px;font-size:12.5px;color:#7f93b3">
      The OS gives each process a small <b>time slice</b> of the CPU, then moves on.
    </p>`;

  const procsEl = root.querySelector('#procs');
  const cpuNow  = root.querySelector('#cpuNow');

  procs.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'proc';
    el.dataset.i = i;
    el.innerHTML = `
      <span class="pname">${p.icon} ${p.name}</span>
      <span class="pstate">Ready</span>
      <div class="pbar"><div class="pfill"></div></div>`;
    procsEl.appendChild(el);
  });

  const rows = [...procsEl.children];
  let current = 0;

  function render(){
    rows.forEach((row, i) => {
      const p = procs[i];
      row.querySelector('.pfill').style.width = p.progress + '%';
      row.querySelector('.pstate').textContent =
        p.progress >= 100 ? 'Done' : (i === current ? 'Running' : 'Ready');
      row.classList.toggle('running', i === current && p.progress < 100);
      row.classList.toggle('done', p.progress >= 100);
    });
    cpuNow.textContent = procs[current].icon + ' ' + procs[current].name;
  }

  function nextFree(){
    for (let k = 1; k <= procs.length; k++){
      const idx = (current + k) % procs.length;
      if (procs[idx].progress < 100) return idx;
    }
    return -1;
  }

  render();

  demoTimer = setInterval(() => {
    procs[current].progress = Math.min(100, procs[current].progress + 14);
    const nxt = nextFree();
    if (nxt === -1){
      procs.forEach(p => p.progress = 0);
      current = 0;
    } else {
      current = nxt;
    }
    render();
  }, 950);
}

/* =========================================================
   DEMO 2 — FILE SYSTEM TREE
   ========================================================= */
function fileDemo(root){
  const tree = {
    name:'This PC', icon:'💻', type:'folder', open:true, kids:[
      { name:'Documents', icon:'📁', type:'folder', kids:[
        { name:'report.docx', icon:'📄', type:'file', size:'48 KB' },
        { name:'budget.xlsx', icon:'📊', type:'file', size:'120 KB' }
      ]},
      { name:'Pictures', icon:'🖼️', type:'folder', kids:[
        { name:'holiday.jpg', icon:'🏞️', type:'file', size:'3.2 MB' },
        { name:'cat.png', icon:'🐱', type:'file', size:'512 KB' }
      ]},
      { name:'Music', icon:'🎵', type:'folder', kids:[
        { name:'playlist.mp3', icon:'🎧', type:'file', size:'7.8 MB' }
      ]}
    ]
  };

  function build(node){
    const branch = document.createElement('div');
    branch.className = 'branch' + (node.open ? ' open' : '');

    const el = document.createElement('div');
    el.className = 'node';
    el.dataset.type = node.type;
    el.dataset.name = node.name;
    if (node.size) el.dataset.size = node.size;
    el.innerHTML = `<span class="tw">${node.type === 'folder' ? '▶' : ''}</span>
                    <span>${node.icon} ${node.name}</span>`;
    branch.appendChild(el);

    if (node.type === 'folder'){
      const kids = document.createElement('div');
      kids.className = 'kids';
      node.kids.forEach(k => kids.appendChild(build(k)));
      branch.appendChild(kids);
    }
    return branch;
  }

  root.innerHTML = `
    <div class="filesys"><div id="tree"></div>
      <div class="file-status" id="fileStatus">Click a folder to expand it, or a file to open it.</div>
    </div>`;

  const treeEl   = root.querySelector('#tree');
  const statusEl = root.querySelector('#fileStatus');
  treeEl.appendChild(build(tree));

  treeEl.addEventListener('click', e => {
    const node = e.target.closest('.node');
    if (!node) return;

    if (node.dataset.type === 'folder'){
      const branch = node.parentElement;
      branch.classList.toggle('open');
      statusEl.textContent = branch.classList.contains('open')
        ? `📂 Opened folder "${node.dataset.name}" — File Management reads the directory entry from disk.`
        : `📁 Closed folder "${node.dataset.name}".`;
    } else {
      statusEl.textContent =
        `📄 Opening "${node.dataset.name}" (${node.dataset.size}) — File Management locates the blocks on disk and hands the data to the app.`;
    }
  });
}

/* =========================================================
   DEMO 3 — MEMORY ALLOCATOR
   ========================================================= */
function memoryDemo(root){
  const TOTAL = 48;
  const COLORS = ['#34d399','#22d3ee','#a78bfa','#fbbf24','#fb7185','#60a5fa'];
  let cells = new Array(TOTAL).fill(null);
  let allocations = [];

  root.innerHTML = `
    <div class="mem-head">
      <span>RAM — <b>8 GB</b></span>
      <span id="memStat">0 / ${TOTAL} blocks used</span>
    </div>
    <div class="mem-grid" id="memGrid"></div>
    <div class="mem-btns">
      <button class="btn primary" id="memAlloc">▶ Open an app</button>
      <button class="btn" id="memFree">■ Close last app</button>
      <button class="btn" id="memReset">↺ Reset</button>
    </div>
    <div class="mem-msg" id="memMsg">Each square is a block of RAM. Try opening a few apps.</div>`;

  const gridEl = root.querySelector('#memGrid');
  const statEl = root.querySelector('#memStat');
  const msgEl  = root.querySelector('#memMsg');

  for (let i = 0; i < TOTAL; i++){
    const c = document.createElement('div');
    c.className = 'cell';
    gridEl.appendChild(c);
  }
  const cellEls = [...gridEl.children];

  function paint(){
    cellEls.forEach((c, i) => {
      c.className = 'cell';
      c.style.removeProperty('--c');
      if (cells[i] !== null){
        c.classList.add('used');
        c.style.setProperty('--c', COLORS[cells[i] % COLORS.length]);
      }
    });
    const used = cells.filter(v => v !== null).length;
    statEl.textContent = `${used} / ${TOTAL} blocks used`;
  }

  function findRun(size){
    let run = 0, start = -1;
    for (let i = 0; i < TOTAL; i++){
      if (cells[i] === null){
        if (run === 0) start = i;
        run++;
        if (run === size) return start;
      } else { run = 0; start = -1; }
    }
    return -1;
  }

  root.querySelector('#memAlloc').addEventListener('click', () => {
    const size  = 3 + Math.floor(Math.random() * 6);
    const start = findRun(size);

    if (start === -1){
      msgEl.textContent = '⚠️ Out of memory! The OS would now swap pages out to disk (virtual memory).';
      return;
    }
    const id = allocations.length;
    for (let i = start; i < start + size; i++) cells[i] = id;
    allocations.push({ start, size, id });
    paint();
    msgEl.textContent = `✅ Allocated ${size} blocks — the OS now guarantees this memory to that process, and no other program can use it.`;
  });

  root.querySelector('#memFree').addEventListener('click', () => {
    if (!allocations.length){
      msgEl.textContent = 'Nothing to close — memory is already free.';
      return;
    }
    const last = allocations.pop();
    for (let i = last.start; i < last.start + last.size; i++) cells[i] = null;
    paint();
    msgEl.textContent = `🗑️ Freed ${last.size} blocks — that RAM is available for the next program.`;
  });

  root.querySelector('#memReset').addEventListener('click', () => {
    cells = new Array(TOTAL).fill(null);
    allocations = [];
    paint();
    msgEl.textContent = 'Reset — all memory is free again.';
  });

  paint();
}

/* =========================================================
   DEMO 4 — PERMISSION CHECK
   ========================================================= */
function securityDemo(root){
  let user = null;

  const RULES = {
    guest: { public: true,  private: false, install: false },
    admin: { public: true,  private: true,  install: true  }
  };

  const ACTIONS = {
    public:  { label:'📄 Open public.txt',   ok:'✅ Allowed — public.txt is readable by everyone.' },
    private: { label:'🔒 Open private.txt',  ok:'✅ Allowed — admin rights confirmed, file unlocked.' },
    install: { label:'📦 Install software',  ok:'✅ Allowed — UAC prompt accepted. Installing…' }
  };

  root.innerHTML = `
    <div class="sec-user">Signed in as: <b id="secUser">nobody</b></div>

    <div class="sec-row">
      <span class="lbl">Step 1 — authenticate</span>
      <button class="btn" data-user="guest">👤 Sign in as Guest</button>
      <button class="btn primary" data-user="admin">🛡️ Sign in as Admin</button>
    </div>

    <div class="sec-row">
      <span class="lbl">Step 2 — try an action</span>
      <button class="btn" data-act="public">📄 Open public.txt</button>
      <button class="btn" data-act="private">🔒 Open private.txt</button>
      <button class="btn" data-act="install">📦 Install software</button>
    </div>

    <div class="sec-msg" id="secMsg">Sign in first, then try an action.</div>`;

  const userEl = root.querySelector('#secUser');
  const msgEl  = root.querySelector('#secMsg');

  function say(text, cls){
    msgEl.textContent = text;
    msgEl.className = 'sec-msg' + (cls ? ' ' + cls : '');
  }

  root.querySelectorAll('[data-user]').forEach(b => {
    b.addEventListener('click', () => {
      user = b.dataset.user;
      userEl.textContent = user === 'admin' ? '🛡️ Administrator' : '👤 Guest user';
      say(`Signed in as ${user}. The OS now knows exactly what you may access.`, 'warn');
    });
  });

  root.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (!user){
        say('🚫 Denied — no user is signed in. The OS authenticates before it authorises.', 'deny');
        return;
      }
      if (RULES[user][act]){
        say(ACTIONS[act].ok, 'ok');
      } else {
        say(`🚫 Denied — a ${user} does not have permission for this. The request never reaches the hardware.`, 'deny');
      }
    });
  });
}

/* =========================================================
   DEMO REGISTRY
   ========================================================= */
const DEMOS = {
  process: processDemo,
  file:    fileDemo,
  memory:  memoryDemo,
  security: securityDemo
};