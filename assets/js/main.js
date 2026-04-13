/* ============================================================
   MARK ANTHONY ANDRADA — Portfolio
   main.js — Monochrome edition
   ============================================================ */

/* ── Navbar ──────────────────────────────────────────────── */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const navLinks  = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id]');
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');
  const mobileLinks = document.querySelectorAll('.nav-mobile-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('visible', window.scrollY > 600);

    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
    navLinks.forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMobile.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  mobileLinks.forEach(l => l.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navMobile.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();

/* ── Reveal on Scroll ────────────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = entry.target.parentElement.querySelectorAll('.reveal:not(.visible)');
      siblings.forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 90));
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── Typewriter ──────────────────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'intelligent workflows',
    'AI-powered chatbots',
    'voice automation agents',
    'RAG pipelines',
    'real results with AI',
  ];

  let pi = 0, ci = 0, deleting = false, pausing = false;

  function tick() {
    const cur = phrases[pi];
    if (pausing) { pausing = false; setTimeout(tick, 1500); return; }
    if (!deleting) {
      el.textContent = cur.slice(0, ci + 1); ci++;
      if (ci === cur.length) { deleting = true; pausing = true; }
      setTimeout(tick, 72);
    } else {
      el.textContent = cur.slice(0, ci - 1); ci--;
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      setTimeout(tick, 36);
    }
  }
  setTimeout(tick, 1000);
})();

/* ── Hero Canvas — Monochrome particle network ───────────── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let pts = [], animId;
  const N = 55, DIST = 130;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }

  function mkPt() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.4,
      // Vary brightness: mostly dim grey, occasional lighter
      bright: Math.random() > 0.8 ? 0.35 : 0.15,
    };
  }

  function init() { resize(); pts = Array.from({ length: N }, mkPt); }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });

    // Connections
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < DIST) {
          const a = (1 - d / DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(255,255,255,${a})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Dots
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.bright})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId); else draw();
  });
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); init(); draw(); });

  init(); draw();
})();

/* ── Workflow Diagram SVG Lines — premium glow ───────────── */
(function initWorkflow() {
  const wrap   = document.querySelector('.workflow-wrap');
  const svg    = document.getElementById('workflowSvg');
  const center = document.querySelector('.workflow-center');
  const nodes  = document.querySelectorAll('.tool-node');
  if (!wrap || !svg || !center || !nodes.length) return;

  function ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  function draw() {
    svg.innerHTML = '';

    // Add defs for glow filter
    const defs = ns('defs');

    // Glow filter for lines
    const filter = ns('filter');
    filter.setAttribute('id', 'lineGlow');
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const blur = ns('feGaussianBlur');
    blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'coloredBlur');
    const merge = ns('feMerge');
    const m1 = ns('feMergeNode'); m1.setAttribute('in', 'coloredBlur');
    const m2 = ns('feMergeNode'); m2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(m1); merge.appendChild(m2);
    filter.appendChild(blur); filter.appendChild(merge);

    // Dot glow filter
    const dotFilter = ns('filter');
    dotFilter.setAttribute('id', 'dotGlow');
    const dotBlur = ns('feGaussianBlur');
    dotBlur.setAttribute('stdDeviation', '4');
    dotBlur.setAttribute('result', 'coloredBlur');
    const dotMerge = ns('feMerge');
    const dm1 = ns('feMergeNode'); dm1.setAttribute('in', 'coloredBlur');
    const dm2 = ns('feMergeNode'); dm2.setAttribute('in', 'SourceGraphic');
    dotMerge.appendChild(dm1); dotMerge.appendChild(dm2);
    dotFilter.appendChild(dotBlur); dotFilter.appendChild(dotMerge);

    defs.appendChild(filter);
    defs.appendChild(dotFilter);
    svg.appendChild(defs);

    const wr = wrap.getBoundingClientRect();
    const cr = center.getBoundingClientRect();
    const cx = cr.left - wr.left + cr.width / 2;
    const cy = cr.top  - wr.top  + cr.height / 2;

    nodes.forEach((node, i) => {
      const nr = node.getBoundingClientRect();
      const nx = nr.left - wr.left + nr.width / 2;
      const ny = nr.top  - wr.top  + nr.height / 2;

      const dur = `${2 + i * 0.3}s`;

      // Base line — dim
      const lineBase = ns('line');
      lineBase.setAttribute('x1', nx); lineBase.setAttribute('y1', ny);
      lineBase.setAttribute('x2', cx); lineBase.setAttribute('y2', cy);
      lineBase.setAttribute('stroke', 'rgba(255,255,255,0.07)');
      lineBase.setAttribute('stroke-width', '1');
      svg.appendChild(lineBase);

      // Glowing dashed line on top
      const line = ns('line');
      line.setAttribute('x1', nx); line.setAttribute('y1', ny);
      line.setAttribute('x2', cx); line.setAttribute('y2', cy);
      line.setAttribute('stroke', 'rgba(255,255,255,0.55)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3 10');
      line.setAttribute('filter', 'url(#lineGlow)');

      const anim = ns('animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '0');
      anim.setAttribute('to', '-26');
      anim.setAttribute('dur', dur);
      anim.setAttribute('repeatCount', 'indefinite');
      line.appendChild(anim);
      svg.appendChild(line);

      // Glowing dot at node end
      const dot = ns('circle');
      dot.setAttribute('cx', nx); dot.setAttribute('cy', ny);
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', 'rgba(255,255,255,0.7)');
      dot.setAttribute('filter', 'url(#dotGlow)');
      svg.appendChild(dot);

      // Pulse dot travelling toward center
      const pulse = ns('circle');
      pulse.setAttribute('r', '3');
      pulse.setAttribute('fill', 'rgba(255,255,255,0.9)');
      pulse.setAttribute('filter', 'url(#dotGlow)');

      const animX = ns('animate');
      animX.setAttribute('attributeName', 'cx');
      animX.setAttribute('from', nx); animX.setAttribute('to', cx);
      animX.setAttribute('dur', dur);
      animX.setAttribute('repeatCount', 'indefinite');

      const animY = ns('animate');
      animY.setAttribute('attributeName', 'cy');
      animY.setAttribute('from', ny); animY.setAttribute('to', cy);
      animY.setAttribute('dur', dur);
      animY.setAttribute('repeatCount', 'indefinite');

      const animOp = ns('animate');
      animOp.setAttribute('attributeName', 'opacity');
      animOp.setAttribute('values', '0;1;0');
      animOp.setAttribute('dur', dur);
      animOp.setAttribute('repeatCount', 'indefinite');

      pulse.appendChild(animX);
      pulse.appendChild(animY);
      pulse.appendChild(animOp);
      svg.appendChild(pulse);
    });
  }

  setTimeout(draw, 150);
  window.addEventListener('resize', () => setTimeout(draw, 150));
})();

/* ── Parallax: subtle hero content drift on scroll ───────── */
(function initParallax() {
  const heroContent = document.querySelector('.hero-content');
  const heroVisual  = document.querySelector('.hero-visual');
  const gridLines   = document.querySelector('.hero-grid-lines');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    if (heroContent) heroContent.style.transform = `translateY(${y * 0.08}px)`;
    if (heroVisual)  heroVisual.style.transform  = `translateY(${y * 0.05}px)`;
    if (gridLines)   gridLines.style.transform   = `translateY(${y * 0.12}px)`;
  }, { passive: true });
})();

/* ── Chatbot Widget ──────────────────────────────────────── */
(function initChatbot() {
  var fab      = document.getElementById('chatbotFab');
  var panel    = document.getElementById('chatbotPanel');
  var closeBtn = document.getElementById('chatbotClose');
  var input    = document.getElementById('chatbotInput');
  var sendBtn  = document.getElementById('chatbotSend');
  var messages = document.getElementById('chatbotMessages');
  if (!fab || !panel) return;

  var WEBHOOK = 'https://n8n.srv1410418.hstgr.cloud/webhook/portfolio-chat';
  var sessionId = 'sess_' + Math.random().toString(36).slice(2, 10);
  var isOpen = false;
  var isLoading = false;

  var iconChat  = fab.querySelector('.fab-icon-chat');
  var iconClose = fab.querySelector('.fab-icon-close');

  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    panel.setAttribute('aria-hidden', !isOpen);
    iconChat.style.display  = isOpen ? 'none'  : '';
    iconClose.style.display = isOpen ? ''      : 'none';
    if (isOpen) { input.focus(); scrollToBottom(); }
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(text, role) {
    var div = document.createElement('div');
    div.className = 'chat-msg chat-msg--' + role;
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'chat-msg chat-msg--bot chat-typing';
    div.innerHTML = '<div class="chat-bubble"><span></span><span></span><span></span></div>';
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function setLoading(state) {
    isLoading = state;
    sendBtn.disabled = state;
    input.disabled = state;
  }

  async function sendMessage() {
    var text = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    addMessage(text, 'user');
    var typing = showTyping();
    setLoading(true);

    try {
      var res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId })
      });
      var data = await res.json();
      typing.remove();
      addMessage(data.reply || 'Sorry, I had trouble responding. Please try again.', 'bot');
    } catch (e) {
      typing.remove();
      addMessage('Connection error — please try again in a moment.', 'bot');
    }

    setLoading(false);
    input.focus();
  }

  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) togglePanel();
  });
})();

/* ── Contact Form ────────────────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form || form.action.includes('YOUR_FORM_ID')) return;

  const btn     = document.getElementById('submitBtn');
  const txtNorm = btn.querySelector('.btn-text');
  const txtSend = btn.querySelector('.btn-sending');
  const success = document.getElementById('formSuccess');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    txtNorm.style.display = 'none';
    txtSend.style.display = 'inline';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; }, 5000);
      } else {
        alert('Something went wrong. Please email me directly.');
      }
    } catch {
      alert('Network error. Please check your connection.');
    } finally {
      btn.disabled = false;
      txtNorm.style.display = 'inline';
      txtSend.style.display = 'none';
    }
  });
})();
