const API_URL = 'http://localhost:3000';
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const productGrid = document.querySelector('.product-grid');
const noResults = document.getElementById('no-results');
const heroButton = document.getElementById('btn-hero');
const modalOverlay = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalPrice = document.getElementById('modal-price');
const modalMarket = document.getElementById('modal-market');
const modalDescription = document.getElementById('modal-description');

let activeCategory = '';

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
                loadProducts(searchInput.value);
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

async function loadProducts(search = '', category = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);

        const response = await fetch(`${API_URL}/products?${params.toString()}`);
        const products = await response.json();

        if (!products.length) {
            productGrid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <h3 class="product-name">${product.name}</h3>
                <p class="price">${product.price}</p>
                <p class="product-category">${product.category}</p>
                <button class="btn-add" data-id="${product.id}">Ver detalhes</button>
            </div>
        `).join('');

        document.querySelectorAll('.btn-add').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                showProductDetails(productId);
            });
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

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

function activateCategoryButton(button) {
    categoryButtons.forEach(item => item.classList.remove('active'));
    if (button && button.classList) {
        button.classList.add('active');
    }
}

searchBtn.addEventListener('click', () => {
    const searchValue = searchInput.value.trim();
    activeCategory = '';
    loadProducts(searchValue);
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchValue = searchInput.value.trim();
        activeCategory = '';
        loadProducts(searchValue);
    }
});

heroButton.addEventListener('click', () => {
    document.querySelector('#products').scrollIntoView({ behavior: 'smooth' });
});

closeModal.addEventListener('click', closeProductModal);
closeModalBtn.addEventListener('click', closeProductModal);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeProductModal();
});

window.addEventListener('load', () => {
    loadProducts();
});

// FOOTER LINKS
const footerModal = document.getElementById('footer-modal');
const closeFooterModal = document.getElementById('close-footer-modal');
const closeFooterModalBtn = document.getElementById('close-footer-modal-btn');
const footerModalTitle = document.getElementById('footer-modal-title');
const footerModalContent = document.getElementById('footer-modal-content');

function showFooterModal(title, content) {
    footerModalTitle.textContent = title;
    footerModalContent.innerHTML = content;
    footerModal.classList.remove('hidden');
}

function closeFooterModalFunc() {
    footerModal.classList.add('hidden');
}

closeFooterModal.addEventListener('click', closeFooterModalFunc);
closeFooterModalBtn.addEventListener('click', closeFooterModalFunc);
footerModal.addEventListener('click', (event) => {
    if (event.target === footerModal) closeFooterModalFunc();
});

// Sobre Nós
document.getElementById('footer-about').addEventListener('click', (e) => {
    e.preventDefault();
    showFooterModal('Sobre Nós', '<p>cuiudos máximos</p>');
});

// Ajuda
document.getElementById('footer-help').addEventListener('click', (e) => {
    e.preventDefault();
    showFooterModal('Ajuda', '<p>se vira kkkkkkkkkkkkj</p>');
});

// Contato
document.getElementById('footer-contact').addEventListener('click', (e) => {
    e.preventDefault();
    showFooterModal('Contato', '<p>190 sei la</p>');
});

// Lojas
document.getElementById('footer-stores').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const stores = [...new Set(products.map(p => p.market))];
        let storesHTML = '<p><strong>Lojas com produtos:</strong></p><ul>';
        stores.forEach(store => {
            storesHTML += `<li>${store}</li>`;
        });
        storesHTML += '</ul>';
        
        showFooterModal('Lojas', storesHTML);
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
        showFooterModal('Lojas', '<p>Erro ao carregar as lojas.</p>');
    }
});