const API_URL = '/api';
let activePropertyId = null;

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'properties') loadProperties();
    if (tabId === 'emis') loadEmis();
}

async function loadDashboard() {
    const res = await fetch(`${API_URL}/dashboard`);
    const data = await res.json();
    document.getElementById('dash-rent').innerText = data.totalRent;
    document.getElementById('dash-emi').innerText = data.totalEmi;
}

// Inline edit toggle
function enableInlineEdit(type, id, currentName, currentAmount) {
    const card = document.getElementById(`${type}-${id}`);
    card.innerHTML = `
        <div class="flex-1 flex gap-2 items-center">
            <input type="text" id="edit-name-${id}" value="${currentName}" class="p-2 rounded-lg text-sm flex-1 bg-black/60 border border-white/20">
            <input type="number" id="edit-val-${id}" value="${currentAmount}" class="p-2 rounded-lg text-sm w-28 bg-black/60 border border-white/20">
        </div>
        <div class="flex gap-2 ml-4">
            <button onclick="saveInlineEdit('${type}', ${id})" class="text-xs bg-cyan-500 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-cyan-400">Save</button>
            <button onclick="${type === 'properties' ? 'loadProperties()' : 'loadEmis()'}" class="text-xs text-gray-400 hover:text-white px-2 py-1.5">Cancel</button>
        </div>
    `;
}

async function saveInlineEdit(endpoint, id) {
    const newName = document.getElementById(`edit-name-${id}`).value;
    const newVal = document.getElementById(`edit-val-${id}`).value;
    const payload = endpoint === 'properties'
        ? { name: newName, rent: parseInt(newVal) }
        : { name: newName, amount: parseInt(newVal) };

    await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    endpoint === 'properties' ? loadProperties() : loadEmis();
    loadDashboard();
}

async function deleteRecord(endpoint, id) {
    if (!confirm("Are you sure?")) return;
    await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
    endpoint === 'properties' ? loadProperties() : loadEmis();
    loadDashboard();
}

// Trash SVG Icon
const trashIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
`;

async function loadProperties() {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    document.getElementById('prop-list').innerHTML = data.map(p => `
        <div id="properties-${p.id}" class="glass p-5 rounded-xl border-l-4 border-l-cyan-500 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p class="font-bold text-lg tracking-wide">${p.name}</p>
                <p class="text-xs text-gray-400 tracking-wider mt-1">
                    TENANT: 
                    <span onclick="openModal(${p.id}, '${p.tenant}', '${p.name}')" class="text-cyan-400 font-bold underline cursor-pointer hover:text-cyan-300">
                        ${p.tenant}
                    </span>
                </p>
                <p class="text-xs text-gray-500 mt-1">Added: ${new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <div class="flex items-center gap-4">
                <p class="text-xl font-bold text-cyan-400">₹${p.rent}</p>
                <button onclick="enableInlineEdit('properties', ${p.id}, '${p.name}', ${p.rent})" class="text-yellow-500 hover:text-yellow-400 text-sm font-semibold">Edit</button>
                <button onclick="deleteRecord('properties', ${p.id})">${trashIcon}</button>
            </div>
        </div>
    `).join('');
}

async function loadEmis() {
    const res = await fetch(`${API_URL}/liabilities`);
    const data = await res.json();
    document.getElementById('emi-list').innerHTML = data.map(e => `
        <div id="liabilities-${e.id}" class="glass p-5 rounded-xl border-l-4 border-l-rose-500 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p class="font-bold text-lg tracking-wide">${e.name}</p>
                <p class="text-xs text-gray-500 mt-1">Added: ${new Date(e.created_at).toLocaleDateString()}</p>
            </div>
            <div class="flex items-center gap-4">
                <p class="text-xl font-bold text-rose-500">₹${e.amount}</p>
                <button onclick="enableInlineEdit('liabilities', ${e.id}, '${e.name}', ${e.amount})" class="text-yellow-500 hover:text-yellow-400 text-sm font-semibold">Edit</button>
                <button onclick="deleteRecord('liabilities', ${e.id})">${trashIcon}</button>
            </div>
        </div>
    `).join('');
}

// Tenant History Modal Logic
function openModal(propId, tenantName, propName) {
    activePropertyId = propId;
    document.getElementById('modal-tenant-name').innerText = tenantName;
    document.getElementById('modal-prop-name').innerText = propName;
    document.getElementById('history-modal').classList.remove('hidden');
    loadHistory(propId);
}

function closeModal() {
    document.getElementById('history-modal').classList.add('hidden');
    activePropertyId = null;
}

async function loadHistory(propId) {
    const res = await fetch(`${API_URL}/properties/${propId}/history`);
    const items = await res.json();
    const container = document.getElementById('history-list');
    if (!items.length) {
        container.innerHTML = `<p class="text-gray-500 text-xs text-center py-4">No records yet.</p>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
                <span class="text-xs font-bold px-2 py-0.5 rounded ${item.entry_type === 'Rent Received' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-yellow-500/20 text-yellow-400'}">
                    ${item.entry_type}
                </span>
                ${item.notes ? `<span class="text-xs text-gray-400 ml-2">${item.notes}</span>` : ''}
                <p class="text-[10px] text-gray-500 mt-1">${new Date(item.created_at).toLocaleString()}</p>
            </div>
            <p class="font-bold text-sm text-white">₹${item.amount}</p>
        </div>
    `).join('');
}

document.getElementById('history-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!activePropertyId) return;
    await fetch(`${API_URL}/properties/${activePropertyId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            entry_type: document.getElementById('h-type').value,
            amount: parseInt(document.getElementById('h-amount').value),
            notes: document.getElementById('h-notes').value
        })
    });
    document.getElementById('h-amount').value = '';
    document.getElementById('h-notes').value = '';
    loadHistory(activePropertyId);
};

// Form Submissions
document.getElementById('prop-form').onsubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('p-name').value,
            tenant: document.getElementById('p-tenant').value,
            rent: parseInt(document.getElementById('p-rent').value)
        })
    });
    e.target.reset();
    loadProperties();
};

document.getElementById('emi-form').onsubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('e-name').value,
            amount: parseInt(document.getElementById('e-amount').value)
        })
    });
    e.target.reset();
    loadEmis();
};

loadDashboard();
