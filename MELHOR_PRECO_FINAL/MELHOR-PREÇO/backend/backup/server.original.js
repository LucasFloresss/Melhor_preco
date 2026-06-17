const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
};

const db = mysql.createConnection(dbConfig);

const sampleProducts = [
    {
        name: 'Maçã Fuji',
        price: 'R$ 5,99/kg',
        image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500',
        category: 'Frutas',
        market: 'Pão de Açúcar',
        description: 'Maçã Fuji fresca e crocante, ideal para lanches e sucos.'
    },
    {
        name: 'Pera Williams',
        price: 'R$ 6,49/kg',
        image: 'https://www.quitandatomio.com.br/upload/1549623754-beneficios-da-pera-williams-para-a-saude.jpg',
        category: 'Frutas',
        market: 'Extra',
        description: 'Pera Williams suculenta, ótima para sobremesas e saladas.'
    },
    {
        name: 'Banana Prata',
        price: 'R$ 4,39/kg',
        image: 'https://meuamigotemumsitio.com.br/wp-content/uploads/2023/07/nature-plant-fruit-ripe-food-produce-501860-pxhere.com_.jpg',
        category: 'Frutas',
        market: 'Assaí',
        description: 'Banana Prata madura, perfeita para vitaminas e sobremesas.'
    },
    {
        name: 'Manga Palmer',
        price: 'R$ 7,99/kg',
        image: 'https://images.unsplash.com/photo-1571041682563-8f3f7d3343e4?w=500',
        category: 'Frutas',
        market: 'Carrefour',
        description: 'Manga Palmer doce e suculenta, ideal para sucos e sobremesas.'
    },
    {
        name: 'Pão Francês',
        price: 'R$ 0,99/un',
        image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=500',
        category: 'Padaria',
        market: 'Carrefour',
        description: 'Pão francês quentinho e crocante por fora, macio por dentro.'
    },
    {
        name: 'Baguete Artesanal',
        price: 'R$ 7,99',
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500',
        category: 'Padaria',
        market: 'Mercado Bom Preço',
        description: 'Baguete artesanal com fermentação lenta, sabor levemente amanteigado.'
    },
    {
        name: 'Filé de Frango',
        price: 'R$ 19,90/kg',
        image: 'https://images.unsplash.com/photo-1604908177520-a9f2d95e8a83?w=500',
        category: 'Carnes',
        market: 'Extra',
        description: 'Peito de frango fresco, pronto para grelhar ou assar.'
    },
    {
        name: 'Leite Integral 1L',
        price: 'R$ 4,19',
        image: 'https://images.unsplash.com/photo-1517957754647-2d8e19aa0561?w=500',
        category: 'Laticínios',
        market: 'Pão de Açúcar',
        description: 'Leite integral fresco, ideal para café, bolos e receitas.'
    },
    {
        name: 'Suco de Laranja 1L',
        price: 'R$ 7,90',
        image: 'https://images.unsplash.com/photo-1572441712577-88b2cf30a7d7?w=500',
        category: 'Bebidas',
        market: 'Mercado Bom Preço',
        description: 'Suco de laranja natural, sem adição de açúcar, pronto para beber.'
    }
];

function seedProducts() {
    db.query('SELECT COUNT(*) AS count FROM products', (err, results) => {
        if (err) {
            console.error('Erro ao contar produtos:', err);
            return;
        }

        if (results[0].count === 0) {
            const query = 'INSERT INTO products (name, price, image, category, market, description) VALUES ?';
            const values = sampleProducts.map(item => [item.name, item.price, item.image, item.category, item.market, item.description]);
            db.query(query, [values], (insertErr) => {
                if (insertErr) {
                    console.error('Erro ao inserir produtos de exemplo:', insertErr);
                    return;
                }
                console.log('Produtos de exemplo inseridos com sucesso.');
            });
        }
    });
}

function ensureColumns(callback) {
    const columns = [
        { name: 'category', definition: "VARCHAR(80) NOT NULL DEFAULT 'Geral'" },
        { name: 'market', definition: "VARCHAR(100) NOT NULL DEFAULT 'Mercado Local'" },
        { name: 'description', definition: "TEXT NOT NULL DEFAULT ''" }
    ];

    let completed = 0;
    columns.forEach(column => {
        db.query('SHOW COLUMNS FROM products LIKE ?', [column.name], (err, results) => {
            if (err) {
                console.error('Erro ao verificar coluna em products:', err);
                process.exit(1);
            }

            if (results.length === 0) {
                db.query(`ALTER TABLE products ADD COLUMN ${column.name} ${column.definition}`, (addErr) => {
                    if (addErr) {
                        console.error('Erro ao adicionar coluna em products:', addErr);
                        process.exit(1);
                    }
                    completed += 1;
                    if (completed === columns.length) callback();
                });
            } else {
                completed += 1;
                if (completed === columns.length) callback();
            }
        });
    });
}

function initializeDatabase() {
    db.query(
        "CREATE DATABASE IF NOT EXISTS melhorpreco CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
        (err) => {
            if (err) {
                console.error('Erro ao criar o banco de dados melhorpreco:', err);
                process.exit(1);
            }

            db.changeUser({ database: 'melhorpreco' }, (changeErr) => {
                if (changeErr) {
                    console.error('Erro ao mudar para o banco melhorpreco:', changeErr);
                    process.exit(1);
                }

                const createTableQuery = `
                    CREATE TABLE IF NOT EXISTS products (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        price VARCHAR(60) NOT NULL,
                        image TEXT NOT NULL,
                        category VARCHAR(80) NOT NULL DEFAULT 'Geral',
                        market VARCHAR(100) NOT NULL DEFAULT 'Mercado Local',
                        description TEXT NOT NULL DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                `;

                db.query(createTableQuery, (tableErr) => {
                    if (tableErr) {
                        console.error('Erro ao criar tabela products:', tableErr);
                        process.exit(1);
                    }
                    ensureColumns(seedProducts);
                });
            });
        }
    );
}

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco SQL:', err);
        process.exit(1);
    }
    console.log('Conectado ao servidor MySQL.');
    initializeDatabase();
});

app.get('/products', (req, res) => {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (search || category) {
        query += ' WHERE ';
        const conditions = [];
        if (search) {
            conditions.push('(name LIKE ? OR category LIKE ? OR market LIKE ? OR description LIKE ?)');
            params.push(`${search}%`, `${search}%`, `${search}%`, `${search}%`);
        }
        if (category) {
            conditions.push('category = ?');
            params.push(category);
        }
        query += conditions.join(' AND ');
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/categories', (req, res) => {
    const query = 'SELECT DISTINCT category FROM products ORDER BY category';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.map(row => row.category));
    });
});

app.get('/products/:id', (req, res) => {
    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json(results[0]);
    });
});

app.post('/products', (req, res) => {
    const { name, price, image, category, market, description } = req.body;
    if (!name || !price || !image || !category || !market || !description) {
        return res.status(400).json({ error: 'Campos name, price, image, category, market e description são obrigatórios.' });
    }

    const query = 'INSERT INTO products (name, price, image, category, market, description) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [name, price, image, category, market, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, name, price, image, category, market, description });
    });
});

app.put('/products/:id', (req, res) => {
    const { name, price, image, category, market, description } = req.body;
    const productId = req.params.id;
    if (!name || !price || !image || !category || !market || !description) {
        return res.status(400).json({ error: 'Campos name, price, image, category, market e description são obrigatórios.' });
    }

    const query = 'UPDATE products SET name = ?, price = ?, image = ?, category = ?, market = ?, description = ? WHERE id = ?';
    db.query(query, [name, price, image, category, market, description, productId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ id: Number(productId), name, price, image, category, market, description });
    });
});

app.delete('/products/:id', (req, res) => {
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ message: 'Produto removido com sucesso.' });
    });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));