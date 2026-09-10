const API_URL = 'http://192.168.1.2/api';

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if(tabId === 'dashboard') loadDashboard();
    if(tabId === 'properties') loadProperties();
    if(tabId === 'emis') loadEmis();
}

async function loadDashboard() {
    const res = await fetch(`${API_URL}/dashboard`);
    const data = await res.json();
    document.getElementById('dash-rent').innerText = data.totalRent;
    document.getElementById('dash-emi').innerText = data.totalEmi;
}

async function loadProperties() {
    const res = await fetch(`${API_URL}/properties`);
    const data = await res.json();
    document.getElementById('prop-list').innerHTML = data.map(p => `
        <div class="glass p-5 rounded-xl border-l-4 border-l-cyan-500 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p class="font-bold text-lg tracking-wide">${p.name}</p>
                <p class="text-xs text-gray-400 tracking-wider mt-1">TENANT: ${p.tenant} <span class="mx-2">|</span> DUE: ${p.due_day}</p>
            </div>
            <p class="text-xl font-bold text-cyan-400">₹${p.rent}</p>
        </div>
    `).join('');
}

async function loadEmis() {
    const res = await fetch(`${API_URL}/liabilities`);
    const data = await res.json();
    document.getElementById('emi-list').innerHTML = data.map(e => `
        <div class="glass p-5 rounded-xl border-l-4 border-l-rose-500 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p class="font-bold text-lg tracking-wide">${e.name}</p>
                <p class="text-xs text-gray-400 tracking-wider mt-1">DUE: ${e.due_day}</p>
            </div>
            <p class="text-xl font-bold text-rose-500">₹${e.amount}</p>
        </div>
    `).join('');
}

document.getElementById('prop-form').onsubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/properties`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: document.getElementById('p-name').value,
            tenant: document.getElementById('p-tenant').value,
            rent: document.getElementById('p-rent').value,
            due_day: document.getElementById('p-due').value
        })
    });
    e.target.reset();
    loadProperties();
};

document.getElementById('emi-form').onsubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/liabilities`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: document.getElementById('e-name').value,
            amount: document.getElementById('e-amount').value,
            due_day: document.getElementById('e-due').value
        })
    });
    e.target.reset();
    loadEmis();
};

// Initialize Dashboard on load
loadDashboard();
