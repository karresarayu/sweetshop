

let allSweets = [];
let filteredSweets = [];

// Load all sweets for shop
async function loadShopSweets() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/sweets`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sweets = await response.json();
        allSweets = sweets;
        filteredSweets = [...sweets];
        
        displaySweets(filteredSweets);
        updateResultsCount(filteredSweets.length);
    } catch (error) {
        console.error('Error loading sweets:', error);
        showAlert('Error loading sweets. Please refresh the page.', 'error');
        displayEmptyState();
    } finally {
        showLoading(false);
    }
}

// Display sweets in shop grid
function displaySweets(sweets) {
    const productGrid = document.getElementById('product-grid');
    
    if (!productGrid) return;
    
    if (sweets.length === 0) {
        productGrid.innerHTML = '<div class="no-products">No sweets found matching your criteria</div>';
        return;
    }
    
    productGrid.innerHTML = sweets.map(sweet => `
        <div class="product-card" data-category="${sweet.category.toLowerCase()}" data-price="${sweet.price}">
            <div class="product-header">
                <div>
                    <h3 class="product-title">${sweet.category}</h3>
                    <div class="product-rating">
                        ⭐ ${sweet.rating || 0}
                    </div>
                </div>
                <span class="product-category">${sweet.category}</span>
            </div>
            <p class="product-description">${sweet.description}</p>
            <div class="product-footer">
                <div>
                    <span class="product-price">${sweet.price.toFixed(2)}</span>
                    <div class="stock-info ${sweet.quantity === 0 ? 'out-of-stock' : ''}">
                        ${sweet.quantity > 0 ? `${sweet.quantity} in stock` : 'Out of stock'}
                    </div>
                </div>
                <button class="btn-add-cart" ${sweet.quantity === 0 ? 'disabled' : ''} 
                        onclick="addToCart('${sweet._id}', '${sweet.category}')">
                    ${sweet.quantity === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

// Display empty state when no sweets are loaded
function displayEmptyState() {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="no-products">
                <h3>No sweets available</h3>
                <p>Our sweet shop is currently being stocked. Please check back later!</p>
            </div>
        `;
    }
}

// Filter sweets based on search and filters
function filterSweets() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (!searchInput || !categoryFilter || !priceFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categoryValue = categoryFilter.value.toLowerCase();
    const priceValue = priceFilter.value;
    
    filteredSweets = allSweets.filter(sweet => {
        // Search filter
        const matchesSearch = !searchTerm || 
            sweet.description.toLowerCase().includes(searchTerm) ||
            sweet.category.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = categoryValue === 'all' || 
            sweet.category.toLowerCase() === categoryValue;
        
        // Price filter
        let matchesPrice = true;
        if (priceValue !== 'all') {
            const price = parseFloat(sweet.price);
            if (priceValue === '0-10') {
                matchesPrice = price <= 10;
            } else if (priceValue === '10-20') {
                matchesPrice = price > 10 && price <= 20;
            } else if (priceValue === '20-max') {
                matchesPrice = price > 20;
            }
        }
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    displaySweets(filteredSweets);
    updateResultsCount(filteredSweets.length);
}

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${count} of ${allSweets.length} sweets`;
    }
}

// Show loading state
function showLoading(show) {
    const productGrid = document.getElementById('product-grid');
    const resultsCount = document.querySelector('.results-count');
    
    if (show) {
        if (productGrid) {
            productGrid.innerHTML = '<div class="loading-spinner">🍭 Loading delicious sweets...</div>';
        }
        if (resultsCount) {
            resultsCount.textContent = 'Loading sweets...';
        }
    }
}

// Add to cart functionality
function addToCart(sweetId, sweetName) {
    // Prevent adding to cart if out of stock (frontend check)
    const sweet = allSweets.find(s => s._id === sweetId);
    if (!sweet || sweet.quantity <= 0) {
        showAlert('This sweet is out of stock!', 'error');
        displaySweets(filteredSweets);
        return;
    }

    // Call backend to decrement stock
    fetch(`${API_BASE_URL}/sweets/${sweetId}/decrement`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            showAlert(data.message || 'Out of stock', 'error');
            // Refresh sweets from backend in case of mismatch
            loadShopSweets();
            return;
        }

        // Show success message
        showAlert(`${sweetName} added to cart!`, 'success');

        // Cart logic
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === sweetId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: sweetId, name: sweetName, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        // Update local stock to match backend
        sweet.quantity = data.quantity;
        displaySweets(filteredSweets);
    })
    .catch(() => {
        showAlert('Server error. Please try again.', 'error');
    });
}

// Update cart count in UI (if you have a cart counter)
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCounter = document.getElementById('cart-count');
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        if (totalItems > 0) {
            cartCounter.classList.add('active');
        } else {
            cartCounter.classList.remove('active');
        }
    }
}

// Auto-refresh shop every 30 seconds to show new admin additions
function startAutoRefresh() {
    setInterval(() => {
        console.log('Auto-refreshing shop for new sweets...');
        loadShopSweets();
    }, 30000); // 30 seconds
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
    
    // Insert at top of page
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Initialize shop
document.addEventListener('DOMContentLoaded', () => {
    // Load sweets immediately
    loadShopSweets();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Update cart count
    updateCartCount();
    
    // Setup search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterSweets);
    }
    
    // Setup filter functionality
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterSweets);
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', filterSweets);
    }
});