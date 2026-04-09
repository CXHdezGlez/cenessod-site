// App State and Data Model
const State = {
    theme: 'dark',
    activeView: 'dashboard',
    wallets: [
        { id: 'w1', name: 'Cuenta Principal', balance: 5430.00, icon: 'fa-building-columns', color: '#4f46e5' },
        { id: 'w2', name: 'Efectivo', balance: 150.50, icon: 'fa-money-bill-wave', color: '#10b981' },
    ],
    categories: [
        { id: 'c1', name: 'Salario', type: 'income', icon: 'fa-briefcase', color: 'var(--cat-salary)' },
        { id: 'c2', name: 'Comida y Restaurantes', type: 'expense', icon: 'fa-utensils', color: 'var(--cat-food)' },
        { id: 'c3', name: 'Vivienda', type: 'expense', icon: 'fa-house', color: 'var(--cat-housing)' },
        { id: 'c4', name: 'Transporte', type: 'expense', icon: 'fa-car', color: 'var(--cat-transport)' },
        { id: 'c5', name: 'Ocio', type: 'expense', icon: 'fa-gamepad', color: 'var(--cat-leisure)' },
    ],
    transactions: [
        // Seed data for visual demonstration
        { id: 't1', type: 'income', amount: 4500, categoryId: 'c1', walletId: 'w1', date: new Date().toISOString().split('T')[0], note: 'Salario Mensual' },
        { id: 't2', type: 'expense', amount: 1200, categoryId: 'c3', walletId: 'w1', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], note: 'Alquiler' },
        { id: 't3', type: 'expense', amount: 45.50, categoryId: 'c2', walletId: 'w1', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], note: 'Supermercado' },
        { id: 't4', type: 'expense', amount: 15, categoryId: 'c2', walletId: 'w2', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], note: 'Café' }
    ]
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTheme();
    initNavigation();
    initModal();
    renderAll();
});

// --- Local Storage Management ---
function saveState() {
    localStorage.setItem('fintrack_data', JSON.stringify(State));
}

function loadState() {
    const saved = localStorage.getItem('fintrack_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        State.transactions = parsed.transactions;
        State.wallets = parsed.wallets;
        State.theme = parsed.theme || 'dark';
    } else {
        // First run, calculate initial wallet balances based on seed data
        recalculateBalances();
    }
}

function recalculateBalances() {
    // Reset to 0
    State.wallets.forEach(w => w.balance = 0);
    // Add up
    State.transactions.forEach(tx => {
        const wallet = State.wallets.find(w => w.id === tx.walletId);
        if (wallet) {
            wallet.balance += (tx.type === 'income' ? tx.amount : -tx.amount);
        }
    });
    saveState();
}

// --- Theme Management ---
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (State.theme === 'dark') {
        body.classList.add('theme-dark');
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        body.classList.remove('theme-dark');
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('theme-dark');
        State.theme = body.classList.contains('theme-dark') ? 'dark' : 'light';
        toggleBtn.innerHTML = State.theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        saveState();
        if(window.updateChartsTheme) window.updateChartsTheme(State.theme);
    });
}

// --- Navigation ---
function initNavigation() {
    const links = document.querySelectorAll('.nav-links a, [data-nav]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view') || link.getAttribute('data-nav');
            if(!targetView) return;

            // Update Active Link (Sidebar only)
            if(link.closest('.nav-links')) {
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');
                
                // Capitalize title
                pageTitle.textContent = targetView.charAt(0).toUpperCase() + targetView.slice(1);
            }

            // Show View
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${targetView}`).classList.add('active');
        });
    });
}

// --- Modal & Forms ---
function initModal() {
    const modal = document.getElementById('tx-modal');
    const btnOpen = document.getElementById('btn-add-transaction');
    const btnClose = document.getElementById('close-modal');
    const form = document.getElementById('tx-form');
    const typeBtns = document.querySelectorAll('.type-btn');

    // Populate Selects
    populateFormSelects('expense');

    btnOpen.addEventListener('click', () => {
        document.getElementById('tx-date').valueAsDate = new Date();
        const activeTypeBtn = document.querySelector('.type-btn.active');
        populateFormSelects(activeTypeBtn ? activeTypeBtn.dataset.type : 'expense');
        
        const newCatInput = document.getElementById('tx-new-category');
        if (newCatInput) {
            newCatInput.style.display = 'none';
            newCatInput.removeAttribute('required');
            newCatInput.value = '';
        }

        modal.classList.add('active');
    });
    
    btnClose.addEventListener('click', () => modal.classList.remove('active'));
    
    // Default to close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Type Switcher
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateFormSelects(btn.dataset.type);
            const newCatInput = document.getElementById('tx-new-category');
            if (newCatInput) {
                newCatInput.style.display = 'none';
                newCatInput.value = '';
                newCatInput.removeAttribute('required');
            }
        });
    });

    // Handle "New Category" option inline
    const catSelect = document.getElementById('tx-category');
    const newCatInput = document.getElementById('tx-new-category');
    
    catSelect.addEventListener('change', (e) => {
        if (e.target.value === 'new_category') {
            newCatInput.style.display = 'block';
            newCatInput.setAttribute('required', 'true');
            newCatInput.focus();
        } else {
            newCatInput.style.display = 'none';
            newCatInput.removeAttribute('required');
            newCatInput.value = '';
        }
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.querySelector('.type-btn.active').dataset.type;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        let categoryId = document.getElementById('tx-category').value;
        const walletId = document.getElementById('tx-wallet').value;
        const date = document.getElementById('tx-date').value;
        const note = document.getElementById('tx-note').value;
        const newCatName = newCatInput ? newCatInput.value : '';

        // Create category on the fly
        if (categoryId === 'new_category' && newCatName.trim() !== "") {
            const newCat = {
                id: 'c' + Date.now(),
                name: newCatName.trim(),
                type: type,
                icon: 'fa-tag',
                color: '#94a3b8' // Default neutral color
            };
            State.categories.push(newCat);
            categoryId = newCat.id;
        }

        const newTx = {
            id: 't' + Date.now(),
            type, amount, categoryId, walletId, date, note
        };

        // Update State
        State.transactions.unshift(newTx); // Add to beginning
        
        // Update Wallet Balance
        const wallet = State.wallets.find(w => w.id === walletId);
        if (wallet) {
            wallet.balance += (type === 'income' ? amount : -amount);
        }

        saveState();
        renderAll();
        
        // Reset and close
        form.reset();
        if (newCatInput) {
            newCatInput.style.display = 'none';
            newCatInput.removeAttribute('required');
        }
        modal.classList.remove('active');
    });

    // Wallet Modal Logic
    const walletModal = document.getElementById('wallet-modal');
    const btnOpenWallet = document.getElementById('btn-add-wallet');
    const btnCloseWallet = document.getElementById('close-wallet-modal');
    const walletForm = document.getElementById('wallet-form');

    if(btnOpenWallet) {
        btnOpenWallet.addEventListener('click', () => {
            walletModal.classList.add('active');
        });
    }

    if(btnCloseWallet) {
        btnCloseWallet.addEventListener('click', () => walletModal.classList.remove('active'));
    }

    walletModal.addEventListener('click', (e) => {
        if (e.target === walletModal) walletModal.classList.remove('active');
    });

    walletForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('wallet-name').value;
        const balance = parseFloat(document.getElementById('wallet-balance').value) || 0;
        
        // Random icon and color for simplicity
        const icons = ['fa-piggy-bank', 'fa-credit-card', 'fa-sack-dollar', 'fa-vault'];
        const colors = ['#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6'];
        
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newWallet = {
            id: 'w' + Date.now(),
            name,
            balance,
            icon: randomIcon,
            color: randomColor
        };

        State.wallets.push(newWallet);
        
        // If they added an initial balance, we should probably record it as a transaction, 
        // but for simplicity MVP we just save it state.
        
        saveState();
        renderAll();
        
        walletForm.reset();
        walletModal.classList.remove('active');
    });
}

function populateFormSelects(type) {
    const catSelect = document.getElementById('tx-category');
    const walSelect = document.getElementById('tx-wallet');

    // Filter categories by type
    const filteredCats = State.categories.filter(c => c.type === type);
    catSelect.innerHTML = `<option value="" disabled selected>Seleccionar categoría...</option>` + 
        filteredCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('') +
        `<option value="new_category">+ Añadir nueva categoría...</option>`;

    // Wallets
    walSelect.innerHTML = State.wallets.map(w => `<option value="${w.id}">${w.name} (${formatCurrency(w.balance)})</option>`).join('');
}

// --- Rendering ---
function renderAll() {
    renderDashboardStats();
    renderTransactions();
    renderWallets();
    if(window.renderCharts) window.renderCharts(State);
}

function renderDashboardStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let income = 0;
    let expense = 0;
    let totalBalance = State.wallets.reduce((acc, w) => acc + w.balance, 0);

    State.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            if (tx.type === 'income') income += tx.amount;
            if (tx.type === 'expense') expense += tx.amount;
        }
    });

    document.getElementById('stat-income').textContent = formatCurrency(income);
    document.getElementById('stat-expenses').textContent = formatCurrency(expense);
    document.getElementById('stat-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('pie-total').textContent = formatCurrency(expense);
}

function renderTransactions() {
    const sortedTx = [...State.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render Dashboard List (Max 5)
    const dashList = document.getElementById('dashboard-tx-list');
    dashList.innerHTML = sortedTx.slice(0, 5).map(tx => createTxCard(tx)).join('') || `<div class="empty-state"><p>Aún no hay transacciones</p></div>`;

    // Render Full List
    const fullList = document.getElementById('full-tx-list');
    fullList.innerHTML = sortedTx.map(tx => createTxCard(tx)).join('') || `<div class="empty-state"><p>Aún no hay transacciones</p></div>`;
}

function createTxCard(tx) {
    const cat = State.categories.find(c => c.id === tx.categoryId);
    const wallet = State.wallets.find(w => w.id === tx.walletId);
    
    const isIncome = tx.type === 'income';
    const amountClass = isIncome ? 'amount-pos' : 'amount-neg';
    const prefix = isIncome ? '+' : '-';

    return `
        <div class="tx-item">
            <div class="tx-left">
                <div class="tx-icon" style="background-color: ${cat?.color}20; color: ${cat?.color}">
                    <i class="fa-solid ${cat?.icon}"></i>
                </div>
                <div class="tx-details">
                    <span class="tx-title">${cat?.name} ${tx.note ? `<span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted)">- ${tx.note}</span>` : ''}</span>
                    <span class="tx-date">${formatDate(tx.date)}</span>
                </div>
            </div>
            <div class="tx-right">
                <div class="tx-amount ${amountClass}">${prefix}${formatCurrency(tx.amount)}</div>
                <div class="tx-wallet">${wallet?.name}</div>
            </div>
        </div>
    `;
}

function renderWallets() {
    const container = document.getElementById('wallets-container');
    if (!container) return;
    
    container.innerHTML = State.wallets.map(w => `
        <div class="glass-card stat-card" style="border-left: 4px solid ${w.color}">
            <div class="stat-icon" style="background-color: ${w.color}20; color: ${w.color}">
                <i class="fa-solid ${w.icon || 'fa-wallet'}"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">${w.name}</span>
                <h2 class="stat-value">${formatCurrency(w.balance)}</h2>
            </div>
        </div>
    `).join('');
}

// --- Utils ---
function formatCurrency(amount) {
    // Format in Spanish
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function formatDate(dateStr) {
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('es-ES', opts);
}
