const API_URL = 'http://localhost:3000';
const categoriesGrid = document.getElementById('categories-grid');
const productsSection = document.getElementById('products-section');
const categoryProductsGrid = document.getElementById('category-products-grid');
const categoryTitle = document.getElementById('category-title');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchSuggestions = document.getElementById('search-suggestions');

const categoryIcons = {
    'Frutas': '🍎',
    'Padaria': '🍞',
    'Carnes': '🥩',
    'Laticínios': '🧀',
    'Bebidas': '🥤',
    'Geral': '📦'
};

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        categoriesGrid.innerHTML = categories.map(category => `
            <div class="category-card" data-category="${category}">
                <span class="category-icon">${categoryIcons[category] || '📦'}</span>
                <div class="category-name">${category}</div>
                <div class="category-count">Explorar →</div>
            </div>
        `).join('');

        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                loadCategoryProducts(category);
            });
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

async function loadCategoryProducts(category) {
    try {
        const response = await fetch(`${API_URL}/products?category=${encodeURIComponent(category)}`);
        const products = await response.json();

        categoryTitle.textContent = `Produtos - ${category}`;
        categoryProductsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.price}</p>
                <button onclick="showProductDetails(${product.id})">Ver detalhes</button>
            </div>
        `).join('');

        productsSection.style.display = 'block';
        productsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar produtos da categoria:', error);
    }
}

async function showProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');

        const product = await response.json();
        alert(`${product.name}\n\nPreço: ${product.price}\nRede: ${product.market}\n\n${product.description}`);
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
    }
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
                window.location.href = `index.html?search=${encodeURIComponent(searchInput.value)}`;
            });
        });
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
    }
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
    if (searchValue) {
        window.location.href = `index.html?search=${encodeURIComponent(searchValue)}`;
    }
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchValue = searchInput.value.trim();
        if (searchValue) {
            window.location.href = `index.html?search=${encodeURIComponent(searchValue)}`;
        }
    }
});

window.addEventListener('load', () => {
    loadCategories();
});
