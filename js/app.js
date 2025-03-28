// DOM Elements
const productGrid = document.querySelector('.product-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const cartIcon = document.querySelector('.cart-icon');
const cartSidebar = document.querySelector('.cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const notification = document.getElementById('notification');
const checkoutOverlay = document.getElementById('checkout-overlay');
const checkoutForm = document.getElementById('checkout-form');
const checkoutItemsContainer = document.querySelector('.checkout-items');
const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
const checkoutShippingEl = document.getElementById('checkout-shipping');
const checkoutTotalEl = document.getElementById('checkout-total');
const cancelCheckoutBtn = document.getElementById('cancel-checkout');
const closeCheckoutBtn = document.getElementById('close-checkout');
const provinceSelect = document.getElementById('province');
const districtSelect = document.getElementById('district');
const wardSelect = document.getElementById('ward');

// Cart array to store items
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Test console log to verify logging works
    console.log('PAGE LOADED - CONSOLE LOGGING TEST');
    console.log('Current cart in localStorage:', JSON.parse(localStorage.getItem('cart') || '[]'));
    
    // Only try to display products if we're on a page with a product grid
    if (productGrid) {
        displayProducts('all');
    }
    
    updateCart();
    
    // Add missing product images with placeholder
    addPlaceholderImages();
    
    // Setup event listeners for cart icon if it exists
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    
    // Setup event listeners for close cart button if it exists
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }
    
    // Setup event listeners for filter buttons if they exist
    if (filterButtons && filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', filterProducts);
        });
    }
    
    // Set up checkout sheet event listeners
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckoutSheet);
    }
    
    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', closeCheckoutSheet);
    }
    
    // Register checkout form submission handler
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get location data from selects
            const provinceSelect = document.getElementById('province');
            const districtSelect = document.getElementById('district');
            // Get location data
            const provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
            const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
            const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || '';
            
            // Create full location string
            const locationString = [wardName, districtName, provinceName].filter(Boolean).join(', ');
            
            // Format data according to the Orders API schema
            const orderData = {
                customer: {
                    fullName: document.getElementById('full-name').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value
                },
                shippingAddress: {
                    province: provinceName,
                    district: districtName,
                    ward: wardName,
                    streetAddress: document.getElementById('address').value
                },
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    variantName: typeof item.variant === 'object' ? item.variant.name : item.variant,
                    colorName: typeof item.color === 'object' ? item.color.name : item.color
                })),
                payment: {
                    method: document.querySelector('input[name="payment-method"]:checked').value.toUpperCase()
                }
            };
            
            // Show loading notification
            showNotification('Processing your order...', 'info', 2000);
            
            // Send order data to API
            fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            })
            .then(response => {
                // Log the full request for debugging
                console.log('Order request:', JSON.stringify(orderData, null, 2));
                
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error('API Error Response:', errorData);
                        throw new Error(errorData.message || 'API request failed');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Show success message
                    showNotification(`Thank you for your order! Order #${data.data.orderNumber} has been placed successfully.`, 'success', 5000);
                    
                    // Clear cart
                    cart = [];
                    updateCart();
                    saveCart();
                    
                    // Close checkout sheet
                    closeCheckoutSheet();
                } else {
                    // Show error message
                    const errorMessage = data.errors ? data.errors.join(', ') : 'Failed to place order. Please try again.';
                    showNotification(errorMessage, 'error', 5000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('An error occurred while processing your order. Please try again.', 'error', 5000);
            });
        });
    }
    
    // Setup checkout overlay click event
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', (e) => {
            if (e.target === checkoutOverlay) {
                closeCheckoutSheet();
            }
        });
    }
});

// Function to add placeholder images for products
function addPlaceholderImages() {
    // Create directories for images if they don't exist
    const productImages = [
        'dell-xps15.jpg', 'macbook-pro.jpg', 'thinkpad-x1.jpg', 'hp-spectre.jpg',
        'asus-rog.jpg', 'acer-predator.jpg', 'surface-laptop.jpg', 'razer-blade.jpg',
        'dell-latitude.jpg', 'hp-elitebook.jpg', 'lenovo-legion.jpg', 'lg-gram.jpg',
        'hero-bg.jpg', 'store.jpg'
    ];
    
    // For each product, check if image fails to load and replace with placeholder
    products.forEach(product => {
        const img = new Image();
        img.src = product.image;
        img.onerror = () => {
            product.image = `https://via.placeholder.com/300x200?text=${product.title.replace(/\s+/g, '+')}`;
        };
    });
}

// Display products in the grid
function displayProducts(category) {
    // Check if the product grid exists (might not on pages like product-detail)
    if (!productGrid) {
        console.log('Product grid not found, likely on a different page.');
        return; // Exit the function to prevent errors
    }
    
    productGrid.innerHTML = '';
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);
    
    filteredProducts.forEach(product => {
        // Calculate prices
        const originalPrice = product.price;
        const discountPercent = product.discount_percent || 0;
        const promotionalPrice = product.discount_price || originalPrice;
        
        // Format prices for display
        const formattedOriginalPrice = parseInt(originalPrice).toLocaleString('vi-VN');
        const formattedPromotionalPrice = parseInt(promotionalPrice).toLocaleString('vi-VN');
        
        // Create price HTML based on whether there's a discount
        let priceHTML = '';
        if (discountPercent > 0) {
            priceHTML = `
                <div class="product-price">
                    <div class="original-price">${formattedOriginalPrice} ₫</div>
                    <div class="promotional-price">
                        ${formattedPromotionalPrice} ₫
                        <span class="discount-badge">-${discountPercent}%</span>
                    </div>
                </div>
            `;
        } else {
            priceHTML = `
                <div class="product-price">
                    <div class="promotional-price">${formattedOriginalPrice} ₫</div>
                </div>
            `;
        }
        
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        
        productCard.innerHTML = `
            <div class="product-image" style="background-image: url('${product.image}')"></div>
            <div class="product-info">
                <div class="product-category">${product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Uncategorized'}</div>
                <a href="product-detail.html?id=${product.id}" class="product-title-link">
                    <h3 class="product-title">${product.title}</h3>
                </a>
                ${priceHTML}
                <div class="product-actions">
                    <button class="btn add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <a href="product-detail.html?id=${product.id}" class="btn view-details">
                        <i class="fas fa-eye"></i> View Details
                    </a>
                </div>
            </div>
        `;
        
        productGrid.appendChild(productCard);
    });
    
    // Add event listeners to the "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Filter products by category
function filterProducts(event) {
    // Remove active class from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    event.currentTarget.classList.add('active');
    
    // Get the category from the button's data attribute
    const category = event.currentTarget.dataset.category;
    
    // Display products of the selected category
    displayProducts(category);
}

// Function to open cart sidebar
function openCart() {
    if (cartSidebar) {
        cartSidebar.classList.add('open');
    }
}

// Function to close cart sidebar
function closeCart() {
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
    }
}

// Enhanced notification system
function showNotification(message, type = 'success', duration = 3000) {
    if (!notification) return;
    
    // Clear any existing notification
    notification.innerHTML = '';
    notification.className = 'notification';
    
    notification.classList.add(type);
    
    // Add icon based on notification type
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    
    // Create notification content
    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    const content = document.createElement('div');
    content.className = 'notification-message';
    content.textContent = message;
    
    const progress = document.createElement('div');
    progress.className = 'notification-progress';
    progress.style.animationDuration = `${duration/1000}s`;
    
    // Append elements to notification
    notification.appendChild(icon);
    notification.appendChild(content);
    notification.appendChild(progress);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Add item to cart
function addToCart(event) {
    // Get the button element, whether it was clicked directly or a child was clicked
    const button = event.target.closest('.add-to-cart');
    if (!button) return;
    
    const productId = button.getAttribute('data-id');
    console.log('Attempting to add product with ID:', productId);
    
    // First try to find with strict equality (handles both string and number IDs)
    let product = products.find(p => p.id === productId);
    
    // If not found, try with parsed integer (for backward compatibility)
    if (!product) {
        const parsedId = parseInt(productId);
        product = products.find(p => p.id === parsedId || p.id === parsedId.toString());
    }
    
    if (!product) {
        console.error('Product not found with ID:', productId);
        console.log('Available product IDs:', products.map(p => p.id));
        showNotification('Sorry, there was an error adding this product to cart', 'error');
        return;
    }
    
    console.log('Product found:', product.title);
    
    // Use the discounted price if available
    const price = product.discount_price && product.discount_percent > 0 ? 
        product.discount_price : product.price;
    
    // Check if item is already in cart
    const existingItem = cart.find(item => item.id.toString() === productId.toString());
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification(`Increased quantity of ${product.title} in cart`, 'success');
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: price,
            original_price: product.price,
            discount_percent: product.discount_percent || 0,
            image: product.image,
            quantity: 1,
            variant: 'Standard', // Default variant
            color: 'Default'     // Default color
        });
        showNotification(`${product.title} added to cart`, 'success');
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart display
    updateCart();
    
    // Add console logging of cart contents
    console.log('------- CART CONTENTS -------');
    console.table(cart); // Shows structured table in console
    
    // Detailed log of each item
    cart.forEach((item, index) => {
        console.group(`Cart item #${index + 1} - ${item.title}`);
        console.log('ID:', item.id);
        console.log('Title:', item.title);
        console.log('Variant:', item.variant);
        console.log('Color:', item.color);
        console.log('Price:', item.price);
        console.log('Quantity:', item.quantity);
        console.log('Original price:', item.original_price);
        console.log('Discount percent:', item.discount_percent);
        if (item.color_adjustment) {
            console.log('Color price adjustment:', item.color_adjustment);
        }
        console.groupEnd();
    });
    console.log('----------------------------');
}

// Update cart display
function updateCart() {
    // Update cart count if the element exists
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Only try to update cart items if the container exists
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                
                // Display variant and color info if they exist
                const variantInfo = item.variant && item.variant !== 'Standard' ? `<span class="cart-item-variant">${item.variant}</span>` : '';
                const colorInfo = item.color && item.color !== 'Default' ? `<span class="cart-item-color">${item.color}</span>` : '';
                
                let variantDisplay = '';
                if (variantInfo || colorInfo) {
                    variantDisplay = `<div class="cart-item-options">${variantInfo} ${colorInfo}</div>`;
                }
                
                // Format prices for display
                const formattedPrice = parseInt(item.price).toLocaleString('vi-VN');
                const formattedOriginalPrice = item.original_price ? parseInt(item.original_price).toLocaleString('vi-VN') : '';
                
                // Create price HTML based on whether there's a discount
                let priceHTML = '';
                if (item.discount_percent > 0 && item.original_price && item.price < item.original_price) {
                    priceHTML = `
                        <div class="cart-item-price">
                            <div class="original-price" style="font-size: 12px;">${formattedOriginalPrice} ₫</div>
                            <div>${formattedPrice} ₫ <span class="discount-badge">-${item.discount_percent}%</span></div>
                        </div>
                    `;
                } else {
                    priceHTML = `<div class="cart-item-price">${formattedPrice} ₫</div>`;
                }
                
                cartItem.innerHTML = `
                    <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title}</h4>
                        ${variantDisplay}
                        ${priceHTML}
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease" data-id="${item.id}" data-variant="${item.variant || ''}" data-color="${item.color || ''}">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}" data-variant="${item.variant || ''}" data-color="${item.color || ''}">+</button>
                            <button class="remove-item" data-id="${item.id}" data-variant="${item.variant || ''}" data-color="${item.color || ''}">Remove</button>
                        </div>
                    </div>
                `;
                
                cartItemsContainer.appendChild(cartItem);
            });
        }
        
        // Update total price
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        cartTotalPrice.textContent = parseInt(totalPrice).toLocaleString('vi-VN');
        
        // Add event listeners for quantity buttons and remove buttons
        const decreaseButtons = document.querySelectorAll('.decrease');
        const increaseButtons = document.querySelectorAll('.increase');
        const removeButtons = document.querySelectorAll('.remove-item');
        
        decreaseButtons.forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });
        
        increaseButtons.forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });
        
        removeButtons.forEach(button => {
            button.addEventListener('click', removeItem);
        });
    }
}

// Increase item quantity
function increaseQuantity(event) {
    const productId = event.target.getAttribute('data-id');
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    const item = cart.find(item => 
        item.id.toString() === productId.toString() && 
        item.variant === variant && 
        item.color === color
    );
    
    if (item) {
        item.quantity += 1;
        updateCart();
        saveCart();
    }
}

// Decrease item quantity
function decreaseQuantity(event) {
    const productId = event.target.getAttribute('data-id');
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    const item = cart.find(item => 
        item.id.toString() === productId.toString() && 
        item.variant === variant && 
        item.color === color
    );
    
    if (item) {
        item.quantity -= 1;
        
        if (item.quantity === 0) {
            removeItemFromCart(productId, variant, color);
        }
        
        updateCart();
        saveCart();
    }
}

// Remove item from cart
function removeItem(event) {
    const productId = event.target.getAttribute('data-id');
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    removeItemFromCart(productId, variant, color);
}

// Remove item from cart helper
function removeItemFromCart(productId, variant, color) {
    cart = cart.filter(item => 
        !(item.id.toString() === productId.toString() && 
        item.variant === variant && 
        item.color === color)
    );
    updateCart();
    saveCart();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Checkout functionality
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'warning');
            return;
        }
        
        openCheckoutSheet();
    });
}

// Open checkout sheet
function openCheckoutSheet() {
    if (!checkoutOverlay) return;
    
    // Populate checkout items
    populateCheckoutItems();
    
    // Calculate and display totals
    updateCheckoutSummary();
    
    // Show the checkout overlay
    checkoutOverlay.classList.add('open');
    
    // Close cart sidebar
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
    }
}

// Close checkout sheet
function closeCheckoutSheet() {
    if (checkoutOverlay) {
        checkoutOverlay.classList.remove('open');
    }
}

// Populate checkout items from cart
function populateCheckoutItems() {
    if (!checkoutItemsContainer) return;
    
    checkoutItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const checkoutItem = document.createElement('div');
        checkoutItem.classList.add('checkout-item');
        
        // Create variant display if applicable
        let variantDisplay = '';
        if (item.variant && item.variant !== 'Standard' || item.color && item.color !== 'Default') {
            let variantText = [];
            if (item.variant && item.variant !== 'Standard') variantText.push(item.variant);
            if (item.color && item.color !== 'Default') variantText.push(item.color);
            variantDisplay = `<div class="checkout-item-variant">${variantText.join(' - ')}</div>`;
        }
        
        // Format price
        const formattedPrice = parseInt(item.price * item.quantity).toLocaleString('vi-VN');
        
        checkoutItem.innerHTML = `
            <div class="checkout-item-image" style="background-image: url('${item.image}')"></div>
            <div class="checkout-item-details">
                <div class="checkout-item-title">${item.title}</div>
                ${variantDisplay}
                <div class="checkout-item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <div class="checkout-item-price">${formattedPrice} ₫</div>
        `;
        
        checkoutItemsContainer.appendChild(checkoutItem);
    });
}

// Update checkout summary with totals
function updateCheckoutSummary() {
    // If checkout elements don't exist, exit
    if (!checkoutSubtotalEl || !checkoutShippingEl || !checkoutTotalEl) {
        return;
    }
    
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate shipping - free shipping for orders over 500,000 VND
    const shipping = subtotal > 500000 ? 0 : 30000;
    
    // Calculate total
    const total = subtotal + shipping;
    
    // Format and display values
    checkoutSubtotalEl.textContent = subtotal.toLocaleString('vi-VN');
    checkoutShippingEl.textContent = shipping.toLocaleString('vi-VN');
    checkoutTotalEl.textContent = total.toLocaleString('vi-VN');
} 