const app = document.getElementById('app');
const searchInput = document.getElementById('search');
const versionBadge = document.getElementById('version-badge');

let catalogData = null;
let currentView = { type: 'home' };

async function loadCatalog() {
  try {
    const response = await fetch('catalog.json');
    catalogData = await response.json();
    versionBadge.textContent = `v${catalogData.version}`;
    renderHome();
  } catch (error) {
    app.innerHTML = '<p>Ошибка загрузки каталога.</p>';
    console.error(error);
  }
}

function renderHome() {
  currentView = { type: 'home' };
  searchInput.value = '';
  let html = '';
  catalogData.types.forEach(type => {
    html += `<div class="tile" onclick="renderModels('${type.id}')"><h2>${type.name}</h2><p>Посмотреть модели и неисправности</p></div>`;
  });
  app.innerHTML = html;
}

function renderModels(typeId) {
  currentView = { type: 'models', typeId };
  searchInput.value = '';
  const models = catalogData.models.filter(m => m.typeId === typeId);
  let html = `<button class="back-btn" onclick="renderHome()">← Назад к категориям</button>`;
  
  if (models.length === 0) html += '<p>Модели пока не добавлены.</p>';
  
  models.forEach(model => {
    html += `<div class="tile" onclick="renderFaults('${model.id}')"><h2>${model.brand} ${model.model}</h2></div>`;
  });
  app.innerHTML = html;
}

function renderFaults(modelId) {
  currentView = { type: 'faults', modelId };
  searchInput.value = '';
  const model = catalogData.models.find(m => m.id === modelId);
  const faultIds = catalogData.modelFaults.filter(mf => mf.modelId === modelId).map(mf => mf.faultId);
  const faults = catalogData.faults.filter(f => faultIds.includes(f.id));
  
  let html = `<button class="back-btn" onclick="renderModels('${model.typeId}')">← Назад к моделям</button>`;
  html += `<h2 style="margin-bottom:15px;">${model.brand} ${model.model}</h2>`;
  
  if (faults.length === 0) html += '<p>Для этой модели неисправности пока не описаны.</p>';
  
  faults.forEach(fault => { html += renderFaultCard(fault); });
  app.innerHTML = html;
}

function renderFaultCard(fault) {
  return `
    <div class="fault-card">
      <h3>${fault.title}</h3>
      <strong>Симптомы:</strong><ul>${fault.symptoms.map(s => `<li>${s}</li>`).join('')}</ul>
      <strong>Причины:</strong><ul>${fault.causes.map(s => `<li>${s}</li>`).join('')}</ul>
      <strong>Диагностика:</strong><ul>${fault.diagnostics.map(s => `<li>${s}</li>`).join('')}</ul>
      <strong>Ремонт:</strong><ul>${fault.repair.map(s => `<li>${s}</li>`).join('')}</ul>
      ${fault.parts && fault.parts.length ? `<strong>Запчасти:</strong><ul>${fault.parts.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
    </div>
  `;
}

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (query === '') {
    if (currentView.type === 'home') renderHome();
    else if (currentView.type === 'models') renderModels(currentView.typeId);
    else if (currentView.type === 'faults') renderFaults(currentView.modelId);
    return;
  }

  const results = catalogData.faults.filter(f => {
    const titleMatch = f.title.toLowerCase().includes(query);
    const symptomMatch = f.symptoms.some(s => s.toLowerCase().includes(query));
    const causeMatch = f.causes.some(c => c.toLowerCase().includes(query));
    return titleMatch || symptomMatch || causeMatch;
  });

  if (results.length === 0) {
    app.innerHTML = '<p>Ничего не найдено.</p>';
    return;
  }

  let html = '<h2 style="margin-bottom:15px;">Результаты поиска:</h2>';
  results.forEach(fault => { html += renderFaultCard(fault); });
  app.innerHTML = html;
});

window.addEventListener('DOMContentLoaded', loadCatalog);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed', err));
}