const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

const sampleProducts = require('./data/products.seed.json');

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
};

const db = mysql.createConnection(dbConfig);

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