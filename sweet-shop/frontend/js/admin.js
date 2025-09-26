

let allSweets = [];
let currentEditingSweetId = null;

// Check admin access and redirect if necessary
function checkAdminAccess() {
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        showAlert('Admin access required', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    return true;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Load all sweets for admin panel
async function loadSweets() {
    try {
        const response = await fetch(`${API_BASE_URL}/sweets`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sweets = await response.json();
        allSweets = sweets;
        displaySweetsInAdmin(sweets);
    } catch (error) {
        console.error('Error loading sweets:', error);
        showAlert('Error loading sweets', 'error');
        displayEmptyAdminState();
    }
}

// Display sweets in admin table
function displaySweetsInAdmin(sweets) {
    const tbody = document.querySelector('.inventory-table tbody');
    
    if (!tbody) return;
    
    if (sweets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No sweets in inventory. Add some sweets to get started!</td></tr>';
        return;
    }
    
    tbody.innerHTML = sweets.map(sweet => `
        <tr>
            <td><span class="product-category">${sweet.category}</span></td>
            <td>$${sweet.price.toFixed(2)}</td>
            <td>${sweet.quantity}</td>
            <td>
                <span class="status-badge ${sweet.quantity > 0 ? 'status-in-stock' : 'status-out-of-stock'}">
                    ${sweet.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editSweet('${sweet._id}')" title="Edit">✏️</button>
                    <button class="btn-icon btn-view" onclick="viewSweet('${sweet._id}')" title="View">👁️</button>
                    <button class="btn-icon btn-delete" onclick="deleteSweet('${sweet._id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Display empty state for admin
function displayEmptyAdminState() {
    const tbody = document.querySelector('.inventory-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading inventory. Please refresh the page.</td></tr>';
    }
}

// Add new sweet (automatically adds to shop)
async function addSweet(sweetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/sweets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(sweetData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Sweet added successfully! It\'s now available in the shop.', 'success');
            loadSweets(); // Refresh admin panel
            closeModal(); // Close add sweet modal
            
            // Additional confirmation
            setTimeout(() => {
                showAlert('Sweet is now live in the shopping section!', 'success');
            }, 2000);
        } else {
            showAlert(data.message || 'Error adding sweet', 'error');
        }
    } catch (error) {
        console.error('Error adding sweet:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Update sweet (changes automatically reflect in shop)
async function updateSweet(sweetId, sweetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/sweets/${sweetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(sweetData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Sweet updated successfully! Changes are live in the shop.', 'success');
            loadSweets(); // Refresh admin panel
            closeModal(); // Close edit modal
        } else {
            showAlert(data.message || 'Error updating sweet', 'error');
        }
    } catch (error) {
        console.error('Error updating sweet:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Delete sweet (removes from shop immediately)
async function deleteSweet(sweetId) {
    const sweet = allSweets.find(s => s._id === sweetId);
    const sweetName = sweet ? sweet.name : 'this sweet';
    
    if (!confirm(`Are you sure you want to delete "${sweetName}"? It will be removed from the shop immediately.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/sweets/${sweetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            showAlert(`"${sweetName}" deleted successfully! It has been removed from the shop.`, 'success');
            loadSweets(); // Refresh admin panel
        } else {
            const data = await response.json();
            showAlert(data.message || 'Error deleting sweet', 'error');
        }
    } catch (error) {
        console.error('Error deleting sweet:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Edit sweet - populate edit modal
function editSweet(sweetId) {
    const sweet = allSweets.find(s => s._id === sweetId);
    if (!sweet) {
        showAlert('Sweet not found', 'error');
        return;
    }

    currentEditingSweetId = sweetId;

    // Populate edit form
    document.getElementById('edit-sweet-id').value = sweetId;
    // Name field removed
    document.getElementById('edit-sweet-category').value = sweet.category;
    document.getElementById('edit-sweet-price').value = sweet.price;
    document.getElementById('edit-sweet-quantity').value = sweet.quantity;
    document.getElementById('edit-sweet-description').value = sweet.description;
    document.getElementById('edit-sweet-rating').value = sweet.rating || 0;

    // Show edit modal
    document.getElementById('edit-sweet-modal').style.display = 'block';
}

// View sweet details
function viewSweet(sweetId) {
    const sweet = allSweets.find(s => s._id === sweetId);
    if (!sweet) {
        showAlert('Sweet not found', 'error');
        return;
    }

    alert(`Sweet Details:
Category: ${sweet.category}
Price: $${sweet.price}
Quantity: ${sweet.quantity}
Rating: ${sweet.rating || 0}/5
Description: ${sweet.description}
Created: ${new Date(sweet.createdAt).toLocaleDateString()}`);
}

// Handle add sweet form submission
function handleAddSweetForm() {
    const form = document.getElementById('add-sweet-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const sweetData = {
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description') ? formData.get('description').trim() : '',
            quantity: parseInt(formData.get('quantity')),
            rating: parseFloat(formData.get('rating')) || 0
        };

        // Validate data
        if (!sweetData.category || !sweetData.description) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }
        if (sweetData.price <= 0) {
            showAlert('Price must be greater than 0', 'error');
            return;
        }
        if (sweetData.quantity < 0) {
            showAlert('Quantity cannot be negative', 'error');
            return;
        }
        await addSweet(sweetData);
    });
}

// Handle edit sweet form submission
function handleEditSweetForm() {
    const form = document.getElementById('edit-sweet-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const sweetData = {
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description').trim(),
            quantity: parseInt(formData.get('quantity')),
            rating: parseFloat(formData.get('rating')) || 0
        };

        // Validate data
        if (!sweetData.category || !sweetData.description) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        if (sweetData.price <= 0) {
            showAlert('Price must be greater than 0', 'error');
            return;
        }

        if (sweetData.quantity < 0) {
            showAlert('Quantity cannot be negative', 'error');
            return;
        }

        await updateSweet(currentEditingSweetId, sweetData);
    });
}

// Modal functions
function openAddSweetModal() {
    document.getElementById('add-sweet-modal').style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset forms
    const addForm = document.getElementById('add-sweet-form');
    const editForm = document.getElementById('edit-sweet-form');
    
    if (addForm) addForm.reset();
    if (editForm) editForm.reset();
    
    currentEditingSweetId = null;
}

// Show alert messages
function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at top of admin container
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.insertBefore(alertDiv, adminContainer.firstChild);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Update user name in header
function updateUserName() {
    const user = getCurrentUser();
    const userName = document.getElementById('user-name');
    const userMenu = document.getElementById('user-menu');
    
    if (user && userName) {
        userName.textContent = `${user.firstName} ${user.lastName}`;
        console.log('User name updated:', user.firstName, user.lastName);
    }
    
    // Make sure user menu is visible
    if (userMenu && user) {
        userMenu.classList.remove('hidden');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAlert('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Check admin access first
    if (!checkAdminAccess()) return;
    
    // Update UI with user info
    updateUserName();
    
    // Load sweets inventory
    loadSweets();
    
    // Setup form handlers
    handleAddSweetForm();
    handleEditSweetForm();
    
    // Add event listeners
    const addNewSweetBtn = document.getElementById('add-new-sweet');
    if (addNewSweetBtn) {
        addNewSweetBtn.addEventListener('click', openAddSweetModal);
    }
    
    // Close modals when clicking outside or on close button
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Close button event listeners
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Refresh inventory every 60 seconds
setInterval(() => {
    console.log('Auto-refreshing admin inventory...');
    loadSweets();
}, 60000); // 60 seconds