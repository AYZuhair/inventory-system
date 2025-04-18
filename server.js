const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const app = express();

// Supabase setup
const supabaseUrl = 'https://qjxkhydsmpfvehjmyhhc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeGtoeWRzbXBmdmVoam15aGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTc3NjgsImV4cCI6MjA1MDk3Mzc2OH0.5iN66Q7V6ovymRkqX7WfY9zmbnT-EYw3v-1BOV5_ku0';
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// In-memory store for sessions
const sessions = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    const session = sessions[token];

    if (!token || !session) {
        return res.status(401).send('Unauthorized: Please log in');
    }

    req.user = session;
    next();
};

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const table = role === 'admin' ? 'admin' : 'staff';
        const { data, error } = await supabaseServer
            .from(table)
            .select('username, password')
            .eq('username', username)
            .eq('password', password);

        if (error) {
            console.error('Error during login:', error);
            return res.status(500).json({ error: 'Error during login' });
        }

        if (data && data.length > 0) {
            const token = Math.random().toString(36).substring(2) + Date.now();
            sessions[token] = { username, role };
            res.json({ token, role });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error during login' });
    }
});

// Staff creation endpoint
app.post('/create-staff', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only');
    }

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const { error } = await supabaseServer
            .from('staff')
            .insert([{ username, password }]);

        if (error) {
            console.error('Error creating staff:', error);
            return res.status(500).send('Error creating staff');
        }

        await supabaseServer.from('actions').insert([{
            action_type: 'staffCreation',
            details: `Staff Creation: ${username}`,
            created_by: req.user.username,
            meta: { username }
        }]);

        res.status(200).send('Staff created');
    } catch (err) {
        console.error('Error creating staff:', err);
        res.status(500).send('Error creating staff');
    }
});

// Inventory endpoints
app.get('/inventory', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabaseServer
            .from('inventory')
            .select('id, name, quantity, price, description');

        if (error) {
            console.error('Error fetching inventory:', error);
            return res.status(500).send('Error reading inventory');
        }

        res.json(data);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).send('Error reading inventory');
    }
});

app.post('/inventory', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only');
    }

    try {
        const items = req.body.items;
        console.log('Received items for upsert:', JSON.stringify(items, null, 2));

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).send('Items array is required and cannot be empty');
        }

        for (const item of items) {
            if (!item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
                return res.status(400).send('Each item must have a name, quantity, and price');
            }
        }

        const { error } = await supabaseServer
            .from('inventory')
            .upsert(items, { onConflict: 'id' });

        if (error) {
            console.error('Supabase error updating inventory:', JSON.stringify(error, null, 2));
            return res.status(500).send(`Error updating inventory: ${error.message}`);
        }

        await supabaseServer.from('actions').insert([{
            action_type: 'inventoryUpdate',
            details: `Inventory updated by ${req.user.username}`,
            created_by: req.user.username,
            meta: { itemCount: items.length }
        }]);

        res.status(200).send('Inventory updated');
    } catch (err) {
        console.error('Unexpected error updating inventory:', err);
        res.status(500).send('Error updating inventory');
    }
});

// Low stock report endpoint
app.post('/report-low', authenticate, async (req, res) => {
    try {
        const { itemId, timestamp } = req.body;
        const { error } = await supabaseServer
            .from('lowstock')
            .insert([{ item_id: itemId, timestamp: new Date(timestamp), reported_by: req.user.username }]);

        if (error) {
            console.error('Error reporting low stock:', error);
            return res.status(500).send('Error reporting low stock');
        }

        const { data: item } = await supabaseServer
            .from('inventory')
            .select('name')
            .eq('id', itemId)
            .single();

        await supabaseServer.from('actions').insert([{
            action_type: 'lowStock',
            details: `Low Stock Report: Item ID ${itemId} (${item.name})`,
            created_by: req.user.username,
            meta: { itemId, timestamp: new Date(timestamp).toISOString() }
        }]);

        res.status(200).send('Low stock reported');
    } catch (err) {
        console.error('Error reporting low stock:', err);
        res.status(500).send('Error reporting low stock');
    }
});

// Adjustment request endpoint
app.post('/request-adjustment', authenticate, async (req, res) => {
    try {
        const { itemId, newQty, reason, timestamp } = req.body;
        const { error } = await supabaseServer
            .from('requests')
            .insert([{
                item_id: itemId,
                new_quantity: newQty,
                reason,
                timestamp: new Date(timestamp),
                requested_by: req.user.username
            }]);

        if (error) {
            console.error('Error requesting adjustment:', error);
            return res.status(500).send('Error requesting adjustment');
        }

        const { data: item } = await supabaseServer
            .from('inventory')
            .select('name')
            .eq('id', itemId)
            .single();

        await supabaseServer.from('actions').insert([{
            action_type: 'adjustment',
            details: `Stock Adjustment Request: Item ID ${itemId} (${item.name}), New Qty ${newQty}, Reason: ${reason}`,
            created_by: req.user.username,
            meta: { itemId, newQty, reason, timestamp: new Date(timestamp).toISOString() }
        }]);

        res.status(200).send('Adjustment requested');
    } catch (err) {
        console.error('Error requesting adjustment:', err);
        res.status(500).send('Error requesting adjustment');
    }
});

// Admin notifications endpoint
app.get('/admin-notifications', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only');
    }

    try {
        const { data, error } = await supabaseServer
            .from('actions')
            .select('timestamp, action_type, details, meta')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching actions:', error);
            return res.status(500).send('Error reading admin notifications');
        }

        const formattedData = data.map(action => {
            const timestamp = action.timestamp;
            const message = action.details;
            return `${timestamp}: ${message}`;
        }).join('\n');

        res.send(formattedData);
    } catch (err) {
        console.error('Error fetching actions:', err);
        res.status(500).send('Error reading admin notifications');
    }
});

// Protected routes
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

app.listen(3000, () => console.log('Server running on port 3000'));