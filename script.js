/* ===== Cyber background — same node-network animation as the main site ===== */
(function(){
  const canvas = document.getElementById('cyber-bg');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const nodes = [];
  const nodeCount = 80;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    });
  }

  function draw() {
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < nodeCount; i++) {
      let node = nodes[i];
      ctx.fillStyle = "#003d3d";
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < nodeCount; j++) {
        let node2 = nodes[j];
        let dist = Math.hypot(node.x - node2.x, node.y - node2.y);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(0,61,61,${1 - dist / 120})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node2.x, node2.y);
          ctx.stroke();
        }
      }

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }

    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
})();

/* ===== Thirukkural rotator =====
   - Flows in fixed order, kural 1 through kural 1330, then wraps back to 1.
   - The kural shown is derived from real clock time (UTC epoch seconds),
     not from when this particular visitor loaded the page — so every
     visitor looking at the site at the same moment sees the same kural.
   - Changes every 25 seconds (15s + the extra 10s). */
const INTERVAL_SECONDS = 25;

let kurals = [];
let currentIndex = -1;
const knoEl = document.getElementById('kno');
const ktextEl = document.getElementById('ktext');
const l1El = ktextEl.querySelector('.l1');
const l2El = ktextEl.querySelector('.l2');
const kporulEl = document.getElementById('kporul');

function indexForNow() {
  const epochSeconds = Math.floor(Date.now() / 1000);
  const slot = Math.floor(epochSeconds / INTERVAL_SECONDS);
  return slot % kurals.length;
}

/* Auto-fit: shrink both kural lines (same size) until the longer one fits the box. */
const KURAL_MAX_PX = 17, KURAL_MIN_PX = 8;
function fitKural() {
  const box = document.querySelector('.kural-box');
  const cs = getComputedStyle(box);
  const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (avail <= 0) return;
  [l1El, l2El].forEach(el => el.style.fontSize = KURAL_MAX_PX + 'px');
  const widest = Math.max(l1El.offsetWidth, l2El.offsetWidth);
  if (!widest) return;
  let size = widest > avail ? KURAL_MAX_PX * (avail / widest) * 0.98 : KURAL_MAX_PX;
  size = Math.max(KURAL_MIN_PX, Math.floor(size * 10) / 10);
  [l1El, l2El].forEach(el => el.style.fontSize = size + 'px');
}
window.addEventListener('resize', fitKural);
window.addEventListener('orientationchange', fitKural);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitKural);

function renderKural(i) {
  const k = kurals[i];
  knoEl.textContent = `குறள் எண்: ${k.no} · அதிகாரம்: ${k.c}`;
  l1El.textContent = k.l1;
  l2El.textContent = k.l2;
  kporulEl.innerHTML = `<b>பொருள்:</b> ${k.p}`;
  fitKural();
}

function tick() {
  const i = indexForNow();
  if (i === currentIndex) return;
  [ktextEl, kporulEl, knoEl].forEach(el => el.classList.add('fade'));
  setTimeout(() => {
    currentIndex = i;
    renderKural(i);
    [ktextEl, kporulEl, knoEl].forEach(el => el.classList.remove('fade'));
  }, 350);
}

fetch('kurals.json', { cache: 'no-store' })
  .then(r => r.json())
  .then(data => {
    kurals = data;
    currentIndex = indexForNow();
    renderKural(currentIndex);
    setInterval(tick, 1000); // check every second; only re-renders when the slot actually changes
  })
  .catch(err => {
    knoEl.textContent = '';
    l1El.textContent = 'திருக்குறள் தரவை ஏற்ற முடியவில்லை.';
    l2El.textContent = '';
    kporulEl.textContent = 'This page must be served over http(s):// — it will not load kurals.json from a file:// path.';
    console.error(err);
  });
