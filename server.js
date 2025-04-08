const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Supabase setup for server-side operations (using service_role key)
const supabaseUrl = 'https://qjxkhydsmpfvehjmyhhc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeGtoeWRzbXBmdmVoam15aGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTc3NjgsImV4cCI6MjA1MDk3Mzc2OH0.5iN66Q7V6ovymRkqX7WfY9zmbnT-EYw3v-1BOV5_ku0';
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// In-memory store for session tokens (for simplicity; use a database in production)
const sessions = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Middleware to protect routes
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    const session = sessions[token];

    if (!token || !session) {
        return res.status(401).send('Unauthorized: Please log in');
    }

    req.user = session;
    next();
};

// New endpoint for staff creation (server-side with service_role key)
app.post('/create-staff', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only');
    }

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const { data, error } = await supabaseServer
            .from('staff')
            .insert([{ username, password }]);

        if (error) {
            console.error('Error creating staff:', error);
            return res.status(500).send('Error creating staff');
        }

        await logAction(`Staff Creation: ${username} (staff) by admin`);
        res.status(200).send('Staff created');
    } catch (err) {
        console.error('Error creating staff:', err);
        res.status(500).send('Error creating staff');
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

app.get('/admin-notifications', async (req, res) => {
    try {
        const data = await fs.readFile('data/actions.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.status(500).send('Error reading admin notifications');
    }
});

app.get('/admin.html', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only');
    }
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/staff.html', authenticate, (req, res) => {
    if (req.user.role !== 'staff') {
        return res.status(403).send('Forbidden: Staff only');
    }
    res.sendFile(path.join(__dirname, 'staff.html'));
});

async function logAction(action) {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp}: ${action}\n`;
    await fs.appendFile('data/actions.txt', entry);
}

app.listen(3000, () => console.log('Server running on port 3000'));