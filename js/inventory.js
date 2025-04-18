let inventory = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const expectedRole = window.location.pathname.includes('admin.html') ? 'admin' : 'staff';

    if (!token || role !== expectedRole) {
        window.location.href = 'index.html';
        return;
    }

    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
        });
    }

    loadInventory();
    if (window.location.pathname.includes('admin.html')) {
        loadAdminNotifications();
    }
});

async function loadInventory() {
    try {
        const response = await fetch('/inventory', {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        const data = await response.json();
        inventory = data.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            description: item.description
        }));
        displayInventory();
        if (window.location.pathname.includes('staff.html')) {
            populateRequestDropdown();
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        showFeedback('Failed to load inventory', false);
    }
}

function displayInventory() {
    const tableBody = document.getElementById('inventoryTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    inventory.forEach((item, index) => {
        const row = document.createElement('tr');
        const isAdmin = window.location.pathname.includes('admin.html');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.description}</td>
            <td>
                ${isAdmin ? 
                    `<button onclick="editItem(${index})" class="btn-neon"><i class="fas fa-edit"></i> Edit</button>
                     <button onclick="deleteItem(${index})" class="btn-neon-secondary"><i class="fas fa-trash"></i> Delete</button>` :
                    `<button onclick="reportLow(${item.id})" ${item.quantity > 5 ? 'disabled' : ''} class="btn-neon"><i class="fas fa-exclamation-triangle"></i> Report Low</button>`}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function saveItem() {
    const editId = document.getElementById('editId').value;
    const name = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    const description = document.getElementById('itemDesc').value;

    if (name && !isNaN(quantity) && !isNaN(price)) {
        let item;
        if (editId) {
            const index = inventory.findIndex(item => item.id === parseInt(editId));
            item = inventory[index] = { id: parseInt(editId), name, quantity, price, description };
        } else {
            item = { id: Date.now(), name, quantity, price, description };
            inventory.push(item);
        }
        await saveInventory(); // Line ~92
        displayInventory();
        clearForm();
        showFeedback('Item saved successfully', true);
    } else {
        showFeedback('Please fill in all required fields', false);
    }
}

function editItem(index) {
    const item = inventory[index];
    document.getElementById('editId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemQty').value = item.quantity;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemDesc').value = item.description;
}

function clearForm() {
    document.getElementById('editId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemDesc').value = '';
}

async function deleteItem(index) {
    inventory.splice(index, 1);
    await saveInventory();
    displayInventory();
    showFeedback('Item deleted successfully', true);
}

async function saveInventory() {
    try {
        const response = await fetch('/inventory', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ items: inventory })
        });
        if (!response.ok) throw new Error('Failed to save inventory'); // Line ~135
    } catch (error) {
        console.error('Error saving inventory:', error);
        showFeedback('Failed to save inventory', false);
    }
}

async function reportLow(itemId) {
    try {
        const response = await fetch('/report-low', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ itemId, timestamp: Date.now() })
        });
        if (response.ok) {
            showFeedback('Low stock reported to admin', true);
        } else {
            showFeedback('Failed to report low stock', false);
        }
    } catch (error) {
        console.error('Error reporting low stock:', error);
        showFeedback('Error reporting low stock', false);
    }
}

async function createStaffAccount() {
    const username = document.getElementById('newStaffUsername').value;
    const password = document.getElementById('newStaffPassword').value;

    if (username && password) {
        try {
            const response = await fetch('/create-staff', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                showFeedback(`Staff ${username} created successfully`, true);
                document.getElementById('newStaffUsername').value = '';
                document.getElementById('newStaffPassword').value = '';
            } else {
                showFeedback('Failed to create staff account', false);
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            showFeedback('Error creating staff account', false);
        }
    } else {
        showFeedback('Please fill in all staff fields', false);
    }
}

async function loadAdminNotifications() {
    try {
        const response = await fetch('/admin-notifications', {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        const text = await response.text();
        const notificationsList = document.getElementById('adminNotifications');
        
        if (text.trim()) {
            const actions = text.trim().split('\n').map(action => {
                const [timestamp, ...rest] = action.split(': ');
                const message = rest.join(': ');
                
                let type, details, meta = '';
                if (message.includes('Low Stock Report')) {
                    type = 'lowStock';
                    const [_, itemInfo] = message.split('Item ID ');
                    const [itemId, itemName] = itemInfo.split(' (');
                    const name = itemName.slice(0, -1); // Remove trailing ')'
                    details = `Staff reported low stock for Item ID: ${itemId} (${name})`;
                    meta = `Reported at: ${new Date(timestamp).toLocaleString()}`;
                } else if (message.includes('Stock Adjustment Request')) {
                    type = 'adjustment';
                    const [_, rest] = message.split('Item ID ');
                    const [itemId, qtyInfo] = rest.split(', New Qty ');
                    const [newQty, reasonInfo] = qtyInfo.split(', Reason: ');
                    const [reason, name] = reasonInfo.split(' (');
                    const itemName = name.slice(0, -1); // Remove trailing ')'
                    details = `Adjustment requested for Item ID: ${itemId} (${itemName})`;
                    meta = `New Quantity: ${newQty} | Reason: ${reason} | At: ${new Date(timestamp).toLocaleString()}`;
                } else if (message.includes('Staff Creation')) {
                    type = 'staffCreation';
                    const [_, staffInfo] = message.split('Staff Creation: ');
                    const [username] = staffInfo.split(' (staff) by admin');
                    details = `New staff account created: ${username}`;
                    meta = `Created at: ${new Date(timestamp).toLocaleString()}`;
                } else {
                    type = 'general';
                    details = message;
                    meta = `Occurred at: ${new Date(timestamp).toLocaleString()}`;
                }

                return { timestamp, type, details, meta };
            });

            actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            displayNotifications(actions);

            const filterSelect = document.getElementById('actionFilter');
            filterSelect.addEventListener('change', () => {
                const filter = filterSelect.value;
                const filteredActions = filter === 'all' 
                    ? actions 
                    : actions.filter(action => action.type === filter);
                displayNotifications(filteredActions);
            });
        } else {
            notificationsList.innerHTML = '<div class="notification-item"><div class="notification-details">No staff activity recorded yet.</div></div>';
        }
    } catch (error) {
        console.error('Error loading admin notifications:', error);
        showFeedback('Failed to load staff actions', false);
    }
}

function displayNotifications(actions) {
    const notificationsList = document.getElementById('adminNotifications');
    notificationsList.innerHTML = actions.map(action => `
        <div class="notification-item ${action.type}">
            <div class="notification-header">
                <span class="notification-type">
                    ${action.type === 'lowStock' ? 'Low Stock' : 
                      action.type === 'adjustment' ? 'Adjustment Request' : 
                      action.type === 'staffCreation' ? 'Staff Creation' : 'General'}
                </span>
                <span class="notification-time">${new Date(action.timestamp).toLocaleString()}</span>
            </div>
            <div class="notification-details">${action.details}</div>
            <div class="notification-meta">${action.meta}</div>
        </div>
    `).join('');
}

function toggleFilter() {
    const filterPanel = document.getElementById('filterPanel');
    filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
}

function populateRequestDropdown() {
    const select = document.getElementById('requestItemId');
    select.innerHTML = '<option value="" disabled selected>Select Item</option>' + 
        inventory.map(item => `<option value="${item.id}">${item.name} (Qty: ${item.quantity})</option>`).join('');
}

async function submitRequest() {
    const itemId = parseInt(document.getElementById('requestItemId').value);
    const newQty = parseInt(document.getElementById('requestQty').value);
    const reason = document.getElementById('requestReason').value;

    if (!itemId || isNaN(newQty) || !reason) {
        showFeedback('Please fill in all request fields', false);
        return;
    }

    try {
        const response = await fetch('/request-adjustment', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ itemId, newQty, reason, timestamp: Date.now() })
        });
        if (response.ok) {
            showFeedback('Adjustment request submitted', true);
            document.getElementById('requestItemId').value = '';
            document.getElementById('requestQty').value = '';
            document.getElementById('requestReason').value = '';
        } else {
            showFeedback('Failed to submit adjustment request', false);
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        showFeedback('Error submitting request', false);
    }
}

function showFeedback(message, isSuccess) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${isSuccess ? 'success' : 'error'}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}