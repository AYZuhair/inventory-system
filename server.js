const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// User routes
app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile('data/users.txt', 'utf8');
        res.send(data);
    } catch (error) {
        res.status(500).send('Error reading users');
    }
});

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const userLine = `${username}:${password}:${role}\n`;
    
    try {
        await fs.appendFile('data/users.txt', userLine);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Inventory routes
app.get('/inventory', async (req, res) => {
    try {
        const data = await fs.readFile('data/inventory.txt', 'utf8');
        res.send(data);
    } catch (error) {
        res.send('');
    }
});

app.post('/inventory', async (req, res) => {
    const { items } = req.body;
    const inventoryLines = items.map(item => 
        `${item.id}:${item.name}:${item.quantity}:${item.price}:${item.description}`
    ).join('\n') + '\n';
    
    try {
        await fs.writeFile('data/inventory.txt', inventoryLines);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// Staff reporting routes
app.post('/report-low', async (req, res) => {
    const { itemId, timestamp } = req.body;
    const reportLine = `${itemId}:${timestamp}\n`;
    
    try {
        await fs.appendFile('data/lowstock.txt', reportLine);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to report low stock' });
    }
});

app.post('/request-adjustment', async (req, res) => {
    const { itemId, newQty, reason, timestamp } = req.body;
    const requestLine = `${itemId}:${newQty}:${reason}:${timestamp}\n`;
    
    try {
        await fs.appendFile('data/requests.txt', requestLine);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});