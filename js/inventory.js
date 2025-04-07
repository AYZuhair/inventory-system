let inventory = [];

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    loadInventory();
});

async function loadInventory() {
    try {
        const response = await fetch('/inventory');
        const text = await response.text();
        if (text.trim()) {
            inventory = text.trim().split('\n').map(line => {
                const [id, name, quantity, price, ...desc] = line.split(':');
                return { 
                    id: parseInt(id), 
                    name, 
                    quantity: parseInt(quantity),
                    price: parseFloat(price) || 0,
                    description: desc.join(':') 
                };
            });
        }
        displayInventory();
        if (window.location.pathname.includes('staff.html')) {
            populateRequestDropdown();
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
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
                    `<button onclick="editItem(${index})">Edit</button>
                     <button onclick="deleteItem(${index})">Delete</button>` :
                    `<button onclick="reportLow(${item.id})" ${item.quantity > 5 ? 'disabled' : ''}>Report Low</button>`}
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
        if (editId) {
            const index = inventory.findIndex(item => item.id === parseInt(editId));
            inventory[index] = { id: parseInt(editId), name, quantity, price, description };
        } else {
            inventory.push({ id: Date.now(), name, quantity, price, description });
        }
        await saveInventory();
        displayInventory();
        clearForm();
    } else {
        alert('Please fill in all required fields');
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
}

async function saveInventory() {
    try {
        const response = await fetch('/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: inventory.map(item => ({
                    ...item,
                    description: item.description.replace(/:/g, ' ')
                }))
            })
        });
        if (!response.ok) throw new Error('Failed to save inventory');
    } catch (error) {
        console.error('Error saving inventory:', error);
    }
}

async function reportLow(itemId) {
    try {
        const response = await fetch('/report-low', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, timestamp: Date.now() })
        });
        if (response.ok) {
            alert('Low stock reported to admin');
        }
    } catch (error) {
        console.error('Error reporting low stock:', error);
    }
}

function populateRequestDropdown() {
    const select = document.getElementById('requestItemId');
    select.innerHTML = '<option value="">Select Item</option>' + 
        inventory.map(item => `<option value="${item.id}">${item.name} (Qty: ${item.quantity})</option>`).join('');
}

async function submitRequest() {
    const itemId = parseInt(document.getElementById('requestItemId').value);
    const newQty = parseInt(document.getElementById('requestQty').value);
    const reason = document.getElementById('requestReason').value;

    if (!itemId || isNaN(newQty) || !reason) {
        alert('Please fill in all request fields');
        return;
    }

    try {
        const response = await fetch('/request-adjustment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, newQty, reason, timestamp: Date.now() })
        });
        if (response.ok) {
            alert('Adjustment request submitted');
            document.getElementById('requestItemId').value = '';
            document.getElementById('requestQty').value = '';
            document.getElementById('requestReason').value = '';
        }
    } catch (error) {
        console.error('Error submitting request:', error);
    }
}