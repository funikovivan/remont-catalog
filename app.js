const SUPABASE_URL = 'https://afkftosxzriipoijuxbh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PvcGTcQkzmnzLTl6H3ahNA_bwUMAGIX';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.getElementById('app');
const searchInput = document.getElementById('search');
const versionBadge = document.getElementById('version-badge');

let allData = { types: [], models: [], faults: [], modelFaults: [] };
let currentView = { type: 'home' };

async function loadData() {
  try {
    const { data: types } = await supabaseClient.from('types').select('*');
    const { data: models } = await supabaseClient.from('models').select('*');
    const { data: faults } = await supabaseClient.from('faults').select('*');
    const { data: modelFaults } = await supabaseClient.from('model_faults').select('*');

    allData = { types, models, faults, modelFaults };
    versionBadge.textContent = 'Онлайн';
    renderHome();
  } catch (error) {
    app.innerHTML = '<p>Ошибка загрузки данных. Проверьте интернет.</p>';
    console.error(error);
  }
}

function renderHome() {
  currentView = { type: 'home' };
  searchInput.value = '';
  let html = '';
  allData.types.forEach(type => {
    html += `<div class="tile" onclick="renderModels('${type.id}')"><h2>${type.name}</h2><p>Посмотреть модели</p></div>`;
  });
  app.innerHTML = html;
}

function renderModels(typeId) {
  currentView = { type: 'models', typeId };
  searchInput.value = '';
  const models = allData.models.filter(m => m.type_id === typeId);
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
  const model = allData.models.find(m => m.id === modelId);
  const faultIds = allData.modelFaults.filter(mf => mf.model_id === modelId).map(mf => mf.fault_id);
  const faults = allData.faults.filter(f => faultIds.includes(f.id));
  
  let html = `<button class="back-btn" onclick="renderModels('${model.type_id}')">← Назад к моделям</button>`;
  html += `<h2 style="margin-bottom:15px;">${model.brand} ${model.model}</h2>`;
  
  if (faults.length === 0) html += '<p>Для этой модели неисправности пока не описаны.</p>';
  
  faults.forEach(fault => { html += renderFaultCard(fault); });
  app.innerHTML = html;
}

function renderFaultCard(fault) {
  return `
    <div class="fault-card">
      <h3>${fault.title}</h3>
      
      <!-- Вывод фотографии запчасти, если ссылка есть -->
      ${fault.photo_url ? `<img src="${fault.photo_url}" style="max-width:100%; border-radius:8px; margin-bottom:10px;" alt="Запчасть">` : ''}
      
      <strong>Симптомы:</strong><ul>${fault.symptoms ? fault.symptoms.map(s => `<li>${s}</li>`).join('') : ''}</ul>
      <strong>Причины:</strong><ul>${fault.causes ? fault.causes.map(c => `<li>${c}</li>`).join('') : ''}</ul>
      <strong>Диагностика:</strong><ul>${fault.diagnostics ? fault.diagnostics.map(d => `<li>${d}</li>`).join('') : ''}</ul>
      <strong>Ремонт:</strong><ul>${fault.repair ? fault.repair.map(r => `<li>${r}</li>`).join('') : ''}</ul>
      
      <!-- Вывод цены, если она указана -->
      ${fault.part_price ? `<div style="margin-top: 15px; padding: 10px; background: #eef; border-radius: 8px; font-weight: bold; color: #1a1a2e;">💰 Стоимость запчасти: ${fault.part_price}</div>` : ''}
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
  
  const results = allData.faults.filter(f => {
    const titleMatch = f.title.toLowerCase().includes(query);
    const symptomMatch = f.symptoms ? f.symptoms.some(s => s.toLowerCase().includes(query)) : false;
    const causeMatch = f.causes ? f.causes.some(c => c.toLowerCase().includes(query)) : false;
    return titleMatch || symptomMatch || causeMatch;
  });

  if (results.length === 0) { app.innerHTML = '<p>Ничего не найдено.</p>'; return; }
  
  let html = '<h2 style="margin-bottom:15px;">Результаты поиска:</h2>';
  results.forEach(fault => { html += renderFaultCard(fault); });
  app.innerHTML = html;
});

window.addEventListener('DOMContentLoaded', loadData);
