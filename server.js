const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile('data/users.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.status(500).send('Error reading users');
    }
});

app.post('/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const userEntry = `${username}:${password}:${role}\n`;
        await fs.appendFile('data/users.txt', userEntry);
        await logAction(`Staff Creation: ${username} (${role}) by admin`);
        res.status(200).send('User created');
    } catch (err) {
        res.status(500).send('Error creating user');
    }
});

app.get('/inventory', async (req, res) => {
    try {
        const data = await fs.readFile('data/inventory.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.status(500).send('Error reading inventory');
    }
});

app.post('/inventory', async (req, res) => {
    try {
        const items = req.body.items;
        const data = items.map(item => `${item.id}:${item.name}:${item.quantity}:${item.price}:${item.description}`).join('\n') + '\n';
        await fs.writeFile('data/inventory.txt', data);
        res.status(200).send('Inventory updated');
    } catch (err) {
        res.status(500).send('Error updating inventory');
    }
});

app.post('/report-low', async (req, res) => {
    try {
        const { itemId, timestamp } = req.body;
        const entry = `${itemId}:${timestamp}\n`;
        await fs.appendFile('data/lowstock.txt', entry);
        await logAction(`Low Stock Report: Item ID ${itemId} at ${new Date(timestamp).toISOString()}`);
        res.status(200).send('Low stock reported');
    } catch (err) {
        res.status(500).send('Error reporting low stock');
    }
});

app.post('/request-adjustment', async (req, res) => {
    try {
        const { itemId, newQty, reason, timestamp } = req.body;
        const entry = `${itemId}:${newQty}:${reason}:${timestamp}\n`;
        await fs.appendFile('data/requests.txt', entry);
        await logAction(`Stock Adjustment Request: Item ID ${itemId}, New Qty ${newQty}, Reason: ${reason} at ${new Date(timestamp).toISOString()}`);
        res.status(200).send('Adjustment requested');
    } catch (err) {
        res.status(500).send('Error requesting adjustment');
    }
});

// New endpoint for admin notifications
app.get('/admin-notifications', async (req, res) => {
    try {
        const data = await fs.readFile('data/actions.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.status(500).send('Error reading admin notifications');
    }
});

// Helper function to log actions
async function logAction(action) {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp}: ${action}\n`;
    await fs.appendFile('data/actions.txt', entry);
}

app.listen(3000, () => console.log('Server running on port 3000'));