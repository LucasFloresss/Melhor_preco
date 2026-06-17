const API_URL = 'http://localhost:3000';
const productGrid = document.getElementById('product-grid');
const noResults = document.getElementById('no-results');
const categoryFilter = document.getElementById('category-filter');
const marketFilter = document.getElementById('market-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const productsInfo = document.getElementById('products-info');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const modalOverlay = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalPrice = document.getElementById('modal-price');
const modalMarket = document.getElementById('modal-market');
const modalDescription = document.getElementById('modal-description');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');

let allProducts = [];
let currentFilter = '';
let currentMarketFilter = '';

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

async function loadAllProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        allProducts = await response.json();
        populateMarketFilter();
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function populateMarketFilter() {
    if (!marketFilter) return;
    // collect distinct markets
    const markets = Array.from(new Set(allProducts.map(p => (p.market || '').trim()).filter(Boolean)));
    // clear old options (keep first default)
    marketFilter.innerHTML = '<option value="">Todos os mercados</option>' + markets.map(m => `<option value="${m}">${m}</option>`).join('');
}

function parsePrice(priceStr) {
    if (!priceStr) return NaN;
    const match = priceStr.match(/[\d.,]+/);
    if (!match) return NaN;
    let num = match[0];
    num = num.replace(/\./g, ''); // remove thousand separator if any
    num = num.replace(/,/g, '.');
    return parseFloat(num);
}

function applyFiltersAndDisplay() {
    let filtered = allProducts.slice();

    const min = parseFloat(minPriceInput.value || '');
    const max = parseFloat(maxPriceInput.value || '');

    if (!isNaN(min)) {
        filtered = filtered.filter(p => !isNaN(parsePrice(p.price)) && parsePrice(p.price) >= min);
    }
    if (!isNaN(max)) {
        filtered = filtered.filter(p => !isNaN(parsePrice(p.price)) && parsePrice(p.price) <= max);
    }

    // If a category is selected, apply it as well
    if (currentFilter) {
        filtered = filtered.filter(p => p.category === currentFilter);
    }

    // If a market is selected, apply it
    if (currentMarketFilter) {
        filtered = filtered.filter(p => (p.market || '').toLowerCase() === currentMarketFilter.toLowerCase());
    }

    displayProducts(filtered);
    updateProductsInfo(filtered.length, currentFilter ? `na categoria <strong>${currentFilter}</strong>` : '');
}

function displayProducts(products) {
    if (products.length === 0) {
        productGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-category">${product.category}</span>
                <p class="product-market">📍 ${product.market}</p>
                <p class="product-price">${product.price}</p>
                <button class="btn-details" onclick="showProductDetails(${product.id})">Ver detalhes</button>
            </div>
        </div>
    `).join('');
}

function updateProductsInfo(count, filterText) {
    if (filterText) {
        productsInfo.innerHTML = `Mostrando <strong>${count}</strong> produto(s) ${filterText}`;
    } else {
        productsInfo.innerHTML = `Total de <strong>${count}</strong> produto(s) disponível(is)`;
    }
}

categoryFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    
    if (currentFilter) {
        const filtered = allProducts.filter(p => p.category === currentFilter);
        displayProducts(filtered);
        updateProductsInfo(filtered.length, `na categoria <strong>${currentFilter}</strong>`);
        clearFilterBtn.style.display = 'inline-block';
    } else {
        displayProducts(allProducts);
        updateProductsInfo(allProducts.length, '');
        clearFilterBtn.style.display = 'none';
    }
    applyFiltersAndDisplay();
});

marketFilter.addEventListener('change', (e) => {
    currentMarketFilter = e.target.value;
    applyFiltersAndDisplay();
    clearFilterBtn.style.display = (currentFilter || currentMarketFilter || minPriceInput.value || maxPriceInput.value) ? 'inline-block' : 'none';
});

clearFilterBtn.addEventListener('click', () => {
    categoryFilter.value = '';
    currentFilter = '';
    displayProducts(allProducts);
    updateProductsInfo(allProducts.length, '');
    clearFilterBtn.style.display = 'none';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    if (marketFilter) marketFilter.value = '';
    currentMarketFilter = '';
    applyFiltersAndDisplay();
});

minPriceInput.addEventListener('input', () => {
    applyFiltersAndDisplay();
});

maxPriceInput.addEventListener('input', () => {
    applyFiltersAndDisplay();
});

async function showProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');

        const product = await response.json();
        modalImage.src = product.image;
        modalImage.alt = product.name;
        modalTitle.textContent = product.name;
        modalCategory.textContent = `Categoria: ${product.category}`;
        modalPrice.textContent = `Preço: ${product.price}`;
        modalMarket.textContent = `Rede: ${product.market}`;
        modalDescription.textContent = product.description;
        modalOverlay.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
    }
}

function closeProductModal() {
    modalOverlay.classList.add('hidden');
}

async function loadSuggestions(searchTerm) {
    if (!searchTerm.trim()) {
        searchSuggestions.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products?search=${encodeURIComponent(searchTerm)}`);
        const products = await response.json();

        if (products.length === 0) {
            searchSuggestions.classList.remove('active');
            return;
        }

        searchSuggestions.innerHTML = products.slice(0, 5).map(product => `
            <div class="suggestion-item" data-id="${product.id}">
                <strong>${product.name}</strong>
                <span class="suggestion-item-category">${product.category}</span>
            </div>
        `).join('');

        searchSuggestions.classList.add('active');

        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                searchInput.value = item.querySelector('strong').textContent;
                searchSuggestions.classList.remove('active');
                performSearch(searchInput.value);
            });
        });
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
    }
}

function performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        displayProducts(allProducts);
        updateProductsInfo(allProducts.length, '');
        return;
    }

    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    displayProducts(filtered);
    updateProductsInfo(filtered.length, `com termo "<strong>${searchTerm}</strong>"`);
}

searchInput.addEventListener('input', (e) => {
    loadSuggestions(e.target.value);
});

searchInput.addEventListener('blur', () => {
    setTimeout(() => {
        searchSuggestions.classList.remove('active');
    }, 200);
});

searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
        loadSuggestions(searchInput.value);
    }
});

searchBtn.addEventListener('click', () => {
    const searchValue = searchInput.value.trim();
    performSearch(searchValue);
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchValue = searchInput.value.trim();
        performSearch(searchValue);
    }
});

closeModal.addEventListener('click', closeProductModal);
closeModalBtn.addEventListener('click', closeProductModal);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeProductModal();
});

window.addEventListener('load', () => {
    loadCategories();
    loadAllProducts();
});

// Page toast for product changes
const pageToast = document.getElementById('page-toast');
const pageToastMsg = document.getElementById('page-toast-msg');

function showPageToast(message, duration = 3000) {
    if (!pageToast || !pageToastMsg) return;
    pageToastMsg.textContent = message;
    pageToast.classList.remove('hidden');
    pageToast.classList.add('show');
    setTimeout(() => {
        pageToast.classList.remove('show');
        pageToast.classList.add('hidden');
    }, duration);
}

window.addEventListener('product-changed', (e) => {
    const action = e?.detail?.action || 'updated';
    if (action === 'created') showPageToast('Produto adicionado com sucesso!');
    else if (action === 'updated') showPageToast('Produto atualizado com sucesso!');
    else if (action === 'deleted') showPageToast('Produto removido com sucesso!');
    // refresh products list
    loadAllProducts();
});
