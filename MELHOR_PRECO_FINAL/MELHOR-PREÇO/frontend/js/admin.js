const form = document.getElementById('product-form');
const tableBody = document.getElementById('admin-table-body');
const productIdInput = document.getElementById('product-id');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const imageInput = document.getElementById('image');
const categoryInput = document.getElementById('category');
const marketInput = document.getElementById('market');
const descriptionInput = document.getElementById('description');
const btnSalvar = document.getElementById('btn-salvar');

const API_URL = 'http://localhost:3000/products';

async function carregarProdutosAdmin() {
    try {
        const response = await fetch(API_URL);
        const produtos = await response.json();
        
        tableBody.innerHTML = ''; 

        produtos.forEach(produto => {
            tableBody.innerHTML += `
                <tr>
                    <td><img src="${produto.image}" width="50" height="50" style="object-fit:cover; border-radius:4px;"></td>
                    <td>${produto.name}</td>
                    <td>${produto.price}</td>
                    <td>${produto.category}</td>
                    <td>${produto.market}</td>
                    <td>
                        <button class="btn-edit" data-id="${produto.id}" data-name="${produto.name}" data-price="${produto.price}" data-image="${produto.image}" data-category="${produto.category}" data-market="${produto.market}" data-description="${produto.description.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">Editar</button>
                        <button class="btn-delete" data-id="${produto.id}">Excluir</button>
                    </td>
                </tr>
            `;
        });

        tableBody.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', () => {
                prepararEdicao(
                    button.dataset.id,
                    button.dataset.name,
                    button.dataset.price,
                    button.dataset.image,
                    button.dataset.category,
                    button.dataset.market,
                    button.dataset.description
                );
            });
        });

        tableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', () => deletarProduto(button.dataset.id));
        });
    } catch (error) {
        console.error("Erro ao carregar tabela:", error);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = productIdInput.value;
    const produtoDados = {
        name: nameInput.value,
        price: priceInput.value,
        image: imageInput.value,
        category: categoryInput.value,
        market: marketInput.value,
        description: descriptionInput.value
    };

    try {
        if (id) {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoDados)
            });
            showAdminToast('Produto atualizado com sucesso!');
            window.dispatchEvent(new CustomEvent('product-changed', { detail: { action: 'updated', id } }));
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoDados)
            });
            showAdminToast('Produto cadastrado com sucesso!');
            window.dispatchEvent(new CustomEvent('product-changed', { detail: { action: 'created' } }));
        }

        form.reset();
        productIdInput.value = '';
        btnSalvar.textContent = 'Salvar Produto';
        carregarProdutosAdmin();
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
    }
});

function prepararEdicao(id, name, price, image, category, market, description) {
    productIdInput.value = id;
    nameInput.value = name;
    priceInput.value = price;
    imageInput.value = image;
    categoryInput.value = category;
    marketInput.value = market;
    descriptionInput.value = description;
    btnSalvar.textContent = 'Atualizar Produto';
    window.scrollTo(0, 0);
}

async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja apagar este produto do banco SQL?')) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            showAdminToast('Produto removido!');
            window.dispatchEvent(new CustomEvent('product-changed', { detail: { action: 'deleted', id } }));
            carregarProdutosAdmin();
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    }
}

// Admin centered modal
const adminModal = document.getElementById('admin-modal');
const adminModalMsg = document.getElementById('admin-modal-msg');
const adminModalOk = document.getElementById('admin-modal-ok');
const adminModalClose = document.getElementById('admin-modal-close');

function showAdminToast(message, duration = 4000) {
    if (!adminModal || !adminModalMsg) return;
    adminModalMsg.textContent = message;
    adminModal.classList.remove('hidden');
    // auto-hide after duration, but allow manual close
    const hide = () => { adminModal.classList.add('hidden'); };
    const timer = setTimeout(hide, duration);

    // Close handlers
    function closeHandler() {
        clearTimeout(timer);
        hide();
        adminModalOk.removeEventListener('click', closeHandler);
        adminModalClose.removeEventListener('click', closeHandler);
        adminModal.removeEventListener('click', outsideHandler);
    }

    function outsideHandler(e) {
        if (e.target === adminModal) closeHandler();
    }

    adminModalOk.addEventListener('click', closeHandler);
    adminModalClose.addEventListener('click', closeHandler);
    adminModal.addEventListener('click', outsideHandler);
}

window.onload = carregarProdutosAdmin;