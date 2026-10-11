// Semester dates (used by the progress bar on the schedule page)
const SEMESTER_START = new Date(2026, 8, 14);
const SEMESTER_END = new Date(2026, 11, 13, 23, 59, 59);

const STORAGE_KEY = 'webte-places';
const DAY_PHRASES = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];

// Hotspot data: positions and sizes are percentages of the image
const HOTSPOTS = [
  { title: 'Monitor Acer', text: 'Na veľkom monitore mávam otorené prezentácie z prednášok pre lepšiu viditeľnosť.', x: 44.5, y: 2.5, w: 51, h: 40 },
  { title: 'Notebook MSI', text: 'Na notebooku sa usilovne vzdelávam a naberám poznatky do štúdia', x: 9, y: 19, w: 32, h: 24 },
  { title: 'Modrá klávesnica', text: 'Mechanická klávesnica s podsvietením.', x: 7, y: 63, w: 65, h: 33 },
  { title: 'Myš Logitech', text: 'Herná myš, ktorú používam aj na prácu.', x: 66.5, y: 61, w: 14, h: 11.5 },
  { title: 'Figúrky', text: 'Snorlax a ďalšie figúrky pri monitore.', x: 53.5, y: 42, w: 13, h: 12 },
  { title: 'Model McLarenu', text: 'Zostavený model formuly z Lego kociek.', x: 32, y: 45, w: 17, h: 8 }
];

// Places that are always shown on the map (home is approximate)
const FIXED_PLACES = {
  school: { name: 'FEI STU, moja škola', lat: 48.1520, lng: 17.0737 },
  home: { name: 'Moje bydlisko (približne)', lat: 48.1110, lng: 17.1085 }
};

document.documentElement.classList.add('js');

/* ---------- Navigation ---------- */
function initNav() {
  const toggle = document.querySelector('.nav__toggle');
  const list = document.getElementById('menu');
  if (!toggle || !list) return;
  toggle.addEventListener('click', () => {
    const isOpen = list.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ---------- Workspace hotspots (only generates markup, interaction is CSS) ---------- */
function initHotspots() {
  const root = document.getElementById('hotspots');
  if (!root) return;
  HOTSPOTS.forEach((item) => {
    const centerX = item.x + item.w / 2;
    const el = document.createElement('div');
    el.className = 'hotspot';
    if (item.y > 55) el.classList.add('hotspot--up');
    if (centerX < 35) el.classList.add('hotspot--left');
    if (centerX > 65) el.classList.add('hotspot--right');
    el.style.setProperty('--x', item.x + '%');
    el.style.setProperty('--y', item.y + '%');
    el.style.setProperty('--w', item.w + '%');
    el.style.setProperty('--h', item.h + '%');
    el.innerHTML = '<button type="button" class="hotspot__btn" aria-label="' + item.title + '"></button>' +
      '<div class="hotspot__panel"><h3>' + item.title + '</h3><p>' + item.text + '</p></div>';
    root.appendChild(el);
  });
}

/* ---------- Schedule ---------- */
function formatTime(totalMinutes) {
  return Math.floor(totalMinutes / 60) + ':' + String(totalMinutes % 60).padStart(2, '0');
}

function highlightCurrentLesson(cells) {
  const status = document.getElementById('schedule-status');
  const now = new Date();
  const day = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  cells.forEach((cell) => cell.classList.remove('schedule__cell--now'));

  // Lessons can overlap (parallel groups), so more than one cell may be current
  const current = cells.filter((cell) => Number(cell.dataset.day) === day &&
    nowMinutes >= Number(cell.dataset.start) && nowMinutes < Number(cell.dataset.end));
  if (current.length > 0) {
    current.forEach((cell) => cell.classList.add('schedule__cell--now'));
    status.textContent = 'Práve prebieha: ' + current.map((cell) => cell.dataset.subject + ' (' +
      cell.dataset.label + ', do ' + formatTime(Number(cell.dataset.end)) + ')').join('; ') +
      '. Teraz ma asi nezastihnete.';
    return;
  }

  // Find the nearest lesson in the following 7 days
  let next = null;
  let nextDistance = Infinity;
  cells.forEach((cell) => {
    let distance = ((Number(cell.dataset.day) - day + 7) % 7) * 1440 + (Number(cell.dataset.start) - nowMinutes);
    if (distance <= 0) distance += 7 * 1440;
    if (distance < nextDistance) {
      nextDistance = distance;
      next = cell;
    }
  });
  const when = Number(next.dataset.day) === day ? 'dnes' : DAY_PHRASES[Number(next.dataset.day)];
  status.textContent = 'Práve nemám výučbu. Najbližšia hodina: ' +
    next.dataset.subject + ' (' + next.dataset.label + ') ' + when + ' o ' + formatTime(Number(next.dataset.start)) + '.';
}

function initFilters(cells) {
  const buttons = document.querySelectorAll('[data-filter]');
  const emptyMessage = document.getElementById('filter-empty');
  const wrap = document.getElementById('table-wrap');
  // Free blocks have no data-type, so they are collected separately
  const freeCells = Array.from(document.querySelectorAll('td.schedule__free'));
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      buttons.forEach((other) => {
        const isActive = other === button;
        other.classList.toggle('btn--active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });
      let visibleCount = 0;
      cells.forEach((cell) => {
        const hidden = filter !== 'all' && cell.dataset.type !== filter;
        cell.classList.toggle('is-filtered-out', hidden);
        if (!hidden) visibleCount += 1;
      });
      // Hide the "Voľné" text whenever a filter is active
      freeCells.forEach((cell) => cell.classList.toggle('is-filtered-out', filter !== 'all'));
      emptyMessage.hidden = visibleCount > 0;
      wrap.hidden = visibleCount === 0;
    });
  });
}

function initSemesterProgress() {
  const bar = document.getElementById('semester-progress');
  const label = document.getElementById('semester-label');
  const now = new Date();
  const ratio = (now - SEMESTER_START) / (SEMESTER_END - SEMESTER_START);
  const percent = Math.min(100, Math.max(0, ratio * 100));
  bar.value = Math.round(percent);
  if (now < SEMESTER_START) label.textContent = 'Semester sa ešte nezačal.';
  else if (now > SEMESTER_END) label.textContent = 'Semester už skončil (100 %).';
  else label.textContent = 'Uplynulo ' + Math.round(percent) + ' % semestra.';
}

function initSchedule() {
  if (!document.getElementById('schedule')) return;
  const cells = Array.from(document.querySelectorAll('td[data-day]'));
  highlightCurrentLesson(cells);
  setInterval(() => highlightCurrentLesson(cells), 60000);
  initFilters(cells);
  initSemesterProgress();
}

/* ---------- Map ---------- */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function formatDistance(km) {
  return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(2).replace('.', ',') + ' km';
}

function loadPlaces() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function savePlaces(places) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch (error) {
    // Storage may be unavailable; the app still works for this session
  }
}

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  const map = L.map(mapEl).setView([48.13, 17.09], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const hint = document.getElementById('map-hint');
  const form = document.getElementById('place-form');
  const nameInput = document.getElementById('place-name');
  const cancelButton = document.getElementById('place-cancel');
  const list = document.getElementById('places');
  const targetSelect = document.getElementById('target');
  const result = document.getElementById('distance-result');

  let places = loadPlaces();
  let selectedId = null;
  let pending = null;
  const customLayer = L.layerGroup().addTo(map);
  let line = null;

  const fixedMarkers = {};
  Object.keys(FIXED_PLACES).forEach((key) => {
    const place = FIXED_PLACES[key];
    fixedMarkers[key] = L.circleMarker([place.lat, place.lng], { radius: 10, weight: 3 })
      .addTo(map).bindTooltip(place.name, { permanent: true, direction: 'top' });
  });

  function render() {
    customLayer.clearLayers();
    if (line) { map.removeLayer(line); line = null; }
    Object.keys(FIXED_PLACES).forEach((key) => fixedMarkers[key].setTooltipContent(FIXED_PLACES[key].name));
    hint.hidden = places.length > 0;
    list.replaceChildren();
    result.textContent = '';

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng]).addTo(customLayer);
      marker.bindPopup(place.name);
      const item = document.createElement('li');
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'btn place-btn' + (place.id === selectedId ? ' btn--active' : '');
      select.textContent = place.name;
      select.addEventListener('click', () => { selectedId = place.id; render(); });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn--small';
      remove.textContent = 'Zmazať';
      remove.setAttribute('aria-label', 'Zmazať bod ' + place.name);
      remove.addEventListener('click', () => {
        places = places.filter((other) => other.id !== place.id);
        if (selectedId === place.id) selectedId = null;
        savePlaces(places);
        render();
      });
      item.append(select, remove);
      list.appendChild(item);

      if (place.id === selectedId) {
        const target = FIXED_PLACES[targetSelect.value];
        const km = haversineKm(place.lat, place.lng, target.lat, target.lng);
        const text = formatDistance(km);
        line = L.polyline([[place.lat, place.lng], [target.lat, target.lng]], { weight: 4, dashArray: '8 8' }).addTo(map);
        marker.bindPopup(place.name + '<br>Vzdialenosť: ' + text).openPopup();
        fixedMarkers[targetSelect.value].setTooltipContent(target.name + ': ' + text);
        result.textContent = place.name + ' → ' + target.name + ': ' + text + ' (vzdušnou čiarou).';
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
      }
    });
    if (places.length > 0 && selectedId === null) {
      result.textContent = 'Vyber bod zo zoznamu a zobrazím vzdialenosť k cieľu.';
    }
  }

  map.on('click', (event) => {
    pending = event.latlng;
    form.hidden = false;
    nameInput.value = '';
    nameInput.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!pending) return;
    const name = nameInput.value.trim() || 'Bod ' + (places.length + 1);
    const place = { id: String(Date.now()), name: name, lat: pending.lat, lng: pending.lng };
    places.push(place);
    selectedId = place.id;
    pending = null;
    form.hidden = true;
    savePlaces(places);
    render();
  });

  cancelButton.addEventListener('click', () => { pending = null; form.hidden = true; });
  targetSelect.addEventListener('change', render);
  render();
}

initNav();
initHotspots();
initSchedule();
initMap();
