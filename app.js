const SUPABASE_URL = 'https://afkftosxzriipoijuxbh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PvcGTcQkzmnzLTl6H3ahNA_bwUMAGIX';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.getElementById('app');
const searchInput = document.getElementById('search');
const versionBadge = document.getElementById('version-badge');

let allData = { types: [], models: [], faults: [], modelFaults: [], parts: [] };
let currentView = { type: 'home' };

async function loadData() {
  try {
    const { data: types } = await supabaseClient.from('types').select('*');
    const { data: models } = await supabaseClient.from('models').select('*');
    const { data: faults } = await supabaseClient.from('faults').select('*');
    const { data: modelFaults } = await supabaseClient.from('model_faults').select('*');
    const { data: parts } = await supabaseClient.from('parts').select('*');

    allData = { types, models, faults, modelFaults, parts };
    versionBadge.textContent = 'Онлайн';
    renderHome();
  } catch (error) {
    app.innerHTML = '<p>Ошибка загрузки данных.</p>';
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
  let html = `<button class="back-btn" onclick="renderHome()">← Назад</button>`;
  
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
  
  let html = `<button class="back-btn" onclick="renderModels('${model.type_id}')">← Назад</button>`;
  html += `<h2 style="margin-bottom:15px;">${model.brand} ${model.model}</h2>`;
  
  if (faults.length === 0) html += '<p>Неисправности пока не добавлены.</p>';
  
  faults.forEach(fault => { html += renderFaultAccordion(fault); });
  app.innerHTML = html;
}

// Функция создания выпадающего списка (Аккордеона)
function renderFaultAccordion(fault) {
  // Находим все детали для этой ошибки
  const faultParts = allData.parts.filter(p => p.fault_id === fault.id);
  
  let partsHtml = '';
  if (faultParts.length > 0) {
    partsHtml = `<div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
      <strong>Запчасти и цены:</strong>`;
    faultParts.forEach(p => {
      partsHtml += `
        <div style="background: #f9f9f9; padding: 10px; margin-top: 8px; border-radius: 6px; border-left: 3px solid #1a1a2e;">
          <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${p.part_type} — ${p.name}</div>
          ${p.photo_url ? `<img src="${p.photo_url}" style="max-width:100px; border-radius:4px; display:block; margin-bottom:5px;">` : ''}
          <div style="font-weight: bold; color: #e63946;">${p.price}</div>
        </div>
      `;
    });
    partsHtml += `</div>`;
  }

  return `
    <div class="fault-card" style="margin-bottom: 10px; padding: 0;">
      <div onclick="toggleAccordion('${fault.id}')" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px;">
        <h3 style="margin: 0; color: #1a1a2e; font-size: 1.1rem;">${fault.title}</h3>
        <span style="font-size: 1.2rem; color: #1a1a2e;">▼</span>
      </div>
      
      <div id="content-${fault.id}" style="display: none; padding: 0 15px 15px 15px; background: #fff; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
        <strong style="display:block; margin-top:10px;">Симптомы:</strong><ul>${fault.symptoms ? fault.symptoms.map(s => `<li>${s}</li>`).join('') : ''}</ul>
        <strong style="display:block; margin-top:10px;">Причины:</strong><ul>${fault.causes ? fault.causes.map(c => `<li>${c}</li>`).join('') : ''}</ul>
        <strong style="display:block; margin-top:10px;">Диагностика:</strong><ul>${fault.diagnostics ? fault.diagnostics.map(d => `<li>${d}</li>`).join('') : ''}</ul>
        <strong style="display:block; margin-top:10px;">Ремонт:</strong><ul>${fault.repair ? fault.repair.map(r => `<li>${r}</li>`).join('') : ''}</ul>
        
        ${partsHtml}
      </div>
    </div>
  `;
}

// Логика раскрытия/закрытия
window.toggleAccordion = function(id) {
  const content = document.getElementById(`content-${id}`);
  if (content.style.display === 'none') {
    content.style.display = 'block';
  } else {
    content.style.display = 'none';
  }
};

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
    return titleMatch || symptomMatch;
  });

  if (results.length === 0) { app.innerHTML = '<p>Ничего не найдено.</p>'; return; }
  
  let html = '<h2 style="margin-bottom:15px;">Результаты поиска:</h2>';
  results.forEach(fault => { html += renderFaultAccordion(fault); });
  app.innerHTML = html;
});

window.addEventListener('DOMContentLoaded', loadData);


