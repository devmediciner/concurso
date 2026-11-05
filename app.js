// MedConcursos Frontend Logic (Compatível com Local e GitHub Pages)

let allVagas = [];
let filteredVagas = [];
let currentView = 'cards'; // 'cards' | 'table'
let currentStatus = 'OPEN'; // 'OPEN' | 'ALL' | 'CLOSED'

// Elements
const cardsContainer = document.getElementById('cardsContainer');
const tableContainer = document.getElementById('tableContainer');
const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const ufFilter = document.getElementById('ufFilter');
const distFilter = document.getElementById('distFilter');
const salaryFilter = document.getElementById('salaryFilter');
const sortBy = document.getElementById('sortBy');
const visibleCount = document.getElementById('visibleCount');
const totalItemsCount = document.getElementById('totalItemsCount');
const lastUpdatedEl = document.getElementById('lastUpdated');
const btnRefresh = document.getElementById('btnRefresh');
const refreshIcon = document.getElementById('refreshIcon');
const viewCardsBtn = document.getElementById('viewCardsBtn');
const viewTableBtn = document.getElementById('viewTableBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const btnResetFilters = document.getElementById('btnResetFilters');
const emptyResetBtn = document.getElementById('emptyResetBtn');
const statusButtons = document.querySelectorAll('.status-btn');
const toastNotification = document.getElementById('toastNotification');
const toastTitle = document.getElementById('toastTitle');
const toastMessage = document.getElementById('toastMessage');
const closeToast = document.getElementById('closeToast');

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statOpenTag = document.getElementById('statOpenTag');
const statTotalMG = document.getElementById('statTotalMG');
const statClosestDist = document.getElementById('statClosestDist');
const statClosestCity = document.getElementById('statClosestCity');
const statHighestSalary = document.getElementById('statHighestSalary');
const statHighestTitle = document.getElementById('statHighestTitle');

// Check if running on static host (e.g. GitHub Pages)
const isStaticHost = window.location.hostname.endsWith('github.io') || 
                     window.location.protocol === 'file:' || 
                     window.location.hostname === '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('hidden', !searchInput.value);
    applyFilters();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    applyFilters();
  });

  ufFilter.addEventListener('change', applyFilters);
  distFilter.addEventListener('change', applyFilters);
  salaryFilter.addEventListener('change', applyFilters);
  sortBy.addEventListener('change', applyFilters);

  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      statusButtons.forEach(b => {
        b.className = 'status-btn px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent';
      });
      btn.className = 'status-btn px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300';
      currentStatus = btn.getAttribute('data-status');
      applyFilters();
    });
  });

  btnResetFilters.addEventListener('click', resetFilters);
  emptyResetBtn.addEventListener('click', resetFilters);

  btnRefresh.addEventListener('click', () => fetchData(true));

  viewCardsBtn.addEventListener('click', () => setView('cards'));
  viewTableBtn.addEventListener('click', () => setView('table'));

  exportCsvBtn.addEventListener('click', exportToCsv);

  if (closeToast) {
    closeToast.addEventListener('click', () => {
      toastNotification.classList.add('hidden');
    });
  }
}

function showToast(title, message) {
  if (!toastNotification) return;
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastNotification.classList.remove('hidden');
  setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 6000);
}

function setView(view) {
  currentView = view;
  if (view === 'cards') {
    cardsContainer.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    viewCardsBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm transition';
    viewTableBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition';
  } else {
    cardsContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');
    viewTableBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm transition';
    viewCardsBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition';
  }
  render();
}

async function fetchData(forceRefresh = false) {
  try {
    refreshIcon.classList.add('animate-spin');
    btnRefresh.disabled = true;

    let response = null;
    let usedStaticFallback = false;

    // Se estiver rodando local com FastAPI, tenta /api/refresh ou /api/vagas
    if (!isStaticHost) {
      const url = forceRefresh ? '/api/refresh' : '/api/vagas';
      const method = forceRefresh ? 'POST' : 'GET';
      try {
        response = await fetch(url, { method });
      } catch (e) {
        console.warn('API local não disponível, usando fallback estático JSON...');
      }
    }

    // Se a API não respondeu ou estamos no GitHub Pages
    if (!response || !response.ok) {
      usedStaticFallback = true;
      const cacheBust = forceRefresh ? `?t=${Date.now()}` : '';
      response = await fetch(`./data/vagas.json${cacheBust}`);
    }

    if (!response.ok) {
      throw new Error(`Falha na requisição: ${response.status}`);
    }

    const json = await response.json();
    const data = json.data || json;
    allVagas = data.vagas || [];

    updateStats(data.stats, data.updated_at);
    populateUfFilter(data.stats?.state_counts || {});
    applyFilters();

    if (forceRefresh) {
      if (usedStaticFallback || isStaticHost) {
        showToast(
          'Dados Recarregados',
          'No GitHub Pages, a atualização do PCI Concursos roda automaticamente todo dia pelo GitHub Actions. Você também pode disparar manualmente pela aba Actions do repositório.'
        );
      } else {
        showToast('Sucesso', 'Vagas atualizadas com sucesso diretamente do PCI Concursos!');
      }
    }

  } catch (error) {
    console.error('Error fetching vacancies:', error);
    alert('Erro ao carregar os dados de vagas. Verifique se o arquivo data/vagas.json existe.');
  } finally {
    refreshIcon.classList.remove('animate-spin');
    btnRefresh.disabled = false;
  }
}

function updateStats(stats, updatedAt) {
  if (!stats) return;

  statTotal.textContent = stats.total || 0;
  statOpenTag.textContent = `${stats.total_open || 0} abertas`;
  statTotalMG.textContent = stats.total_mg || 0;

  if (stats.closest) {
    statClosestDist.textContent = `${stats.closest.dist_km} km`;
    statClosestCity.textContent = `${stats.closest.city} (${stats.closest.uf})`;
  } else {
    statClosestDist.textContent = '--';
    statClosestCity.textContent = 'Nenhuma encontrada';
  }

  if (stats.highest_salary) {
    statHighestSalary.textContent = stats.highest_salary.salary_str || '--';
    statHighestTitle.textContent = stats.highest_salary.title || '--';
  }

  if (updatedAt) {
    const d = new Date(updatedAt);
    lastUpdatedEl.textContent = `Atualizado às ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

function populateUfFilter(stateCounts) {
  const currentSelected = ufFilter.value;
  ufFilter.innerHTML = '<option value="ALL">Todos os Estados</option>';

  const entries = Object.entries(stateCounts);
  entries.sort((a, b) => {
    if (a[0] === 'MG') return -1;
    if (b[0] === 'MG') return 1;
    if (a[0] === 'SP' && b[0] !== 'MG') return -1;
    if (b[0] === 'SP' && a[0] !== 'MG') return 1;
    return a[0].localeCompare(b[0]);
  });

  entries.forEach(([uf, count]) => {
    if (!uf) return;
    const opt = document.createElement('option');
    opt.value = uf;
    opt.textContent = `${uf} (${count})`;
    if (uf === 'MG') {
      opt.textContent = `⭐ MG - Minas Gerais (${count})`;
    }
    ufFilter.appendChild(opt);
  });

  if (currentSelected && [...ufFilter.options].some(o => o.value === currentSelected)) {
    ufFilter.value = currentSelected;
  }
}

function resetFilters() {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  ufFilter.value = 'ALL';
  distFilter.value = 'ALL';
  salaryFilter.value = 'ALL';
  sortBy.value = 'dist_asc';

  statusButtons.forEach(btn => {
    if (btn.getAttribute('data-status') === 'OPEN') {
      btn.className = 'status-btn px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300';
    } else {
      btn.className = 'status-btn px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent';
    }
  });
  currentStatus = 'OPEN';

  applyFilters();
}

function applyFilters() {
  const q = searchInput.value.toLowerCase().trim();
  const selectedUf = ufFilter.value;
  const maxDist = distFilter.value === 'ALL' ? null : parseFloat(distFilter.value);
  const minSalary = salaryFilter.value;
  const sortType = sortBy.value;

  filteredVagas = allVagas.filter(v => {
    // Status
    if (currentStatus === 'OPEN' && !v.is_open) return false;
    if (currentStatus === 'CLOSED' && v.is_open) return false;

    // UF
    if (selectedUf !== 'ALL' && v.uf !== selectedUf) return false;

    // Distance
    if (maxDist !== null) {
      if (v.dist_km === null || v.dist_km > maxDist) return false;
    }

    // Salary
    if (minSalary === 'ONLY_DISCLOSED' && v.salary_val <= 0) return false;
    if (!isNaN(parseFloat(minSalary)) && parseFloat(minSalary) > 0) {
      if (v.salary_val < parseFloat(minSalary)) return false;
    }

    // Free Text Search
    if (q) {
      const matchTitle = (v.title || '').toLowerCase().includes(q);
      const matchHeadline = (v.headline || '').toLowerCase().includes(q);
      const matchCity = (v.city || '').toLowerCase().includes(q);
      const matchUf = (v.uf || '').toLowerCase().includes(q);
      const matchDetails = (v.details || '').toLowerCase().includes(q);
      if (!matchTitle && !matchHeadline && !matchCity && !matchUf && !matchDetails) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filteredVagas.sort((a, b) => {
    if (sortType === 'dist_asc') {
      if (a.dist_km === null && b.dist_km === null) return 0;
      if (a.dist_km === null) return 1;
      if (b.dist_km === null) return -1;
      return a.dist_km - b.dist_km;
    }
    if (sortType === 'dist_desc') {
      if (a.dist_km === null && b.dist_km === null) return 0;
      if (a.dist_km === null) return 1;
      if (b.dist_km === null) return -1;
      return b.dist_km - a.dist_km;
    }
    if (sortType === 'salary_desc') {
      return (b.salary_val || 0) - (a.salary_val || 0);
    }
    if (sortType === 'salary_asc') {
      const aVal = a.salary_val > 0 ? a.salary_val : 99999999;
      const bVal = b.salary_val > 0 ? b.salary_val : 99999999;
      return aVal - bVal;
    }
    if (sortType === 'deadline_asc') {
      if (!a.deadline_iso) return 1;
      if (!b.deadline_iso) return -1;
      return a.deadline_iso.localeCompare(b.deadline_iso);
    }
    if (sortType === 'deadline_desc') {
      if (!a.deadline_iso) return 1;
      if (!b.deadline_iso) return -1;
      return b.deadline_iso.localeCompare(a.deadline_iso);
    }
    if (sortType === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  visibleCount.textContent = filteredVagas.length;
  totalItemsCount.textContent = allVagas.length;

  render();
}

function getDistanceBadge(v) {
  if (v.dist_km === null) {
    if (v.uf === 'Nacional') {
      return `<span class="badge-far text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
        <i data-lucide="globe" class="w-3 h-3"></i> Âmbito Nacional
      </span>`;
    }
    return `<span class="badge-far text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
      <i data-lucide="map-pin-off" class="w-3 h-3"></i> Sem distância
    </span>`;
  }

  if (v.dist_km <= 70) {
    return `<span class="badge-near text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
      <i data-lucide="zap" class="w-3 h-3"></i> ${v.dist_km} km (Vizinho)
    </span>`;
  }
  if (v.dist_km <= 150) {
    return `<span class="badge-near text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
      <i data-lucide="car" class="w-3 h-3"></i> ${v.dist_km} km (Próximo)
    </span>`;
  }
  if (v.dist_km <= 300) {
    return `<span class="badge-medium text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
      <i data-lucide="navigation" class="w-3 h-3"></i> ${v.dist_km} km
    </span>`;
  }
  return `<span class="badge-far text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
    <i data-lucide="map-pin" class="w-3 h-3"></i> ${v.dist_km} km
  </span>`;
}

function getStatusBadge(v) {
  if (!v.is_open) {
    return `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      Encerrado
    </span>`;
  }
  if (v.days_remaining !== null && v.days_remaining <= 2) {
    return `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
      Últimos ${v.days_remaining <= 0 ? 'momentos' : v.days_remaining + ' dia(s)'}
    </span>`;
  }
  return `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
    Inscrições Abertas
  </span>`;
}

function render() {
  if (filteredVagas.length === 0) {
    cardsContainer.innerHTML = '';
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  if (currentView === 'cards') {
    renderCards();
  } else {
    renderTable();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderCards() {
  cardsContainer.innerHTML = filteredVagas.map(v => {
    const isMG = v.uf === 'MG';
    const cardBorder = isMG ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200';
    const mgTag = isMG ? `<span class="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">MG</span>` : '';

    return `
      <div class="bg-white rounded-2xl border ${cardBorder} shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
        
        <!-- Header: Title, City/UF & Badges -->
        <div class="space-y-2">
          
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${mgTag}
              <span class="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                ${v.city || 'Brasil'} • ${v.uf}
              </span>
            </div>
            <div>
              ${getStatusBadge(v)}
            </div>
          </div>

          <h2 class="text-sm font-bold text-slate-800 leading-snug line-clamp-2 hover:text-blue-600 transition">
            <a href="${v.link}" target="_blank" rel="noopener noreferrer">${v.title}</a>
          </h2>

          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            ${v.headline || v.details}
          </p>
        </div>

        <!-- Metric badges: Distance & Salary -->
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2.5">
          
          <!-- Distance from Divinópolis -->
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 flex items-center gap-1 text-[11px]">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-500"></i> De Divinópolis:
            </span>
            <div class="flex items-center gap-1.5">
              ${getDistanceBadge(v)}
              ${v.maps_url ? `
                <a href="${v.maps_url}" target="_blank" title="Ver trajeto de carro no Google Maps" 
                   class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition">
                  <i data-lucide="navigation-2" class="w-3.5 h-3.5"></i>
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Salary -->
          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span class="text-slate-500 flex items-center gap-1 text-[11px]">
              <i data-lucide="circle-dollar-sign" class="w-3.5 h-3.5 text-emerald-600"></i> Remuneração:
            </span>
            <span class="font-extrabold ${v.salary_val > 0 ? 'text-emerald-700 text-sm' : 'text-slate-600 text-xs'}">
              ${v.salary_str}
            </span>
          </div>

        </div>

        <!-- Footer Info: Vacancies, Deadline & Button -->
        <div class="space-y-3 pt-1 text-xs">
          
          <div class="flex items-center justify-between text-slate-600 text-[11px]">
            <span class="flex items-center gap-1">
              <i data-lucide="users" class="w-3 h-3 text-slate-400"></i>
              ${v.vacancies}
            </span>
            <span class="flex items-center gap-1 font-medium ${v.is_open ? 'text-blue-700' : 'text-slate-500'}">
              <i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i>
              Até ${v.deadline_str}
            </span>
          </div>

          <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
            <a href="${v.link}" target="_blank" rel="noopener noreferrer" 
               class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm hover:shadow">
              <span>Ver Edital & Detalhes</span>
              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
            </a>

            ${v.maps_url ? `
              <a href="${v.maps_url}" target="_blank" rel="noopener noreferrer" 
                 title="Trajeto no Google Maps"
                 class="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition shadow-sm">
                <i data-lucide="map" class="w-4 h-4"></i>
              </a>
            ` : ''}
          </div>

        </div>

      </div>
    `;
  }).join('');
}

function renderTable() {
  tableBody.innerHTML = filteredVagas.map(v => {
    const isMG = v.uf === 'MG';
    const rowBg = isMG ? 'bg-emerald-50/30' : 'hover:bg-slate-50';

    return `
      <tr class="${rowBg} transition text-slate-700">
        
        <!-- Cargo / Concurso -->
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 line-clamp-1 max-w-xs">
            <a href="${v.link}" target="_blank" class="hover:text-blue-600 transition">${v.title}</a>
          </div>
          <div class="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
            ${v.headline}
          </div>
        </td>

        <!-- Local -->
        <td class="py-3 px-3 whitespace-nowrap">
          <div class="flex items-center gap-1.5">
            ${isMG ? `<span class="bg-emerald-600 text-white text-[9px] font-bold px-1 rounded">MG</span>` : ''}
            <span class="font-semibold text-slate-800">${v.city}</span>
            <span class="text-slate-400 font-medium">(${v.uf})</span>
          </div>
        </td>

        <!-- Distância -->
        <td class="py-3 px-3 whitespace-nowrap">
          <div class="flex items-center gap-1.5">
            ${getDistanceBadge(v)}
          </div>
        </td>

        <!-- Salário -->
        <td class="py-3 px-3 whitespace-nowrap font-bold ${v.salary_val > 0 ? 'text-emerald-700' : 'text-slate-600'}">
          ${v.salary_str}
        </td>

        <!-- Vagas -->
        <td class="py-3 px-3 whitespace-nowrap text-slate-600">
          ${v.vacancies}
        </td>

        <!-- Inscrições Até -->
        <td class="py-3 px-3 whitespace-nowrap">
          <div class="font-medium text-slate-800">${v.deadline_str}</div>
          <div>${getStatusBadge(v)}</div>
        </td>

        <!-- Ações -->
        <td class="py-3 px-3 whitespace-nowrap text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${v.maps_url ? `
              <a href="${v.maps_url}" target="_blank" title="Rota a partir de Divinópolis"
                 class="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition">
                <i data-lucide="map" class="w-4 h-4"></i>
              </a>
            ` : ''}
            <a href="${v.link}" target="_blank" title="Ver no PCI Concursos"
               class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium inline-flex items-center gap-1 transition">
              <span>Edital</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>
          </div>
        </td>

      </tr>
    `;
  }).join('');
}

function exportToCsv() {
  if (filteredVagas.length === 0) {
    alert('Nenhuma vaga visível para exportar.');
    return;
  }

  const headers = [
    'Concurso',
    'Cidade',
    'Estado',
    'Distancia_Divinopolis_km',
    'Distancia_Estrada_Estimada_km',
    'Salario_Maximo',
    'Vagas',
    'Encerramento',
    'Status',
    'Link_PCI'
  ];

  const rows = filteredVagas.map(v => [
    `"${(v.title || '').replace(/"/g, '""')}"`,
    `"${(v.city || '').replace(/"/g, '""')}"`,
    `"${v.uf || ''}"`,
    v.dist_km !== null ? v.dist_km : '',
    v.dist_road_km !== null ? v.dist_road_km : '',
    `"${(v.salary_str || '').replace(/"/g, '""')}"`,
    `"${(v.vacancies || '').replace(/"/g, '""')}"`,
    `"${v.deadline_str || ''}"`,
    `"${v.status || ''}"`,
    `"${v.link || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `concursos_medico_divinopolis_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
