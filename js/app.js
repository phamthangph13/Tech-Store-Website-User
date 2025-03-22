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

// Cart array to store items
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
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
                <div class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                <h3 class="product-title">${product.title}</h3>
                ${priceHTML}
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
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
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        
        // Update active filter button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Display filtered products
        displayProducts(filter);
    });
});

// Toggle cart sidebar
cartIcon.addEventListener('click', () => {
    cartSidebar.classList.add('open');
});

closeCartBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
});

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
    
    // Update cart and localStorage
    updateCart();
    saveCart();
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

// DOM elements for checkout sheet
const checkoutOverlay = document.getElementById('checkout-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout');
const cancelCheckoutBtn = document.getElementById('cancel-checkout');
const checkoutForm = document.getElementById('checkout-form');
const checkoutItemsContainer = document.querySelector('.checkout-items');
const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
const checkoutShippingEl = document.getElementById('checkout-shipping');
const checkoutTotalEl = document.getElementById('checkout-total');

// Set up checkout sheet event listeners
if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', closeCheckoutSheet);
}

if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener('click', closeCheckoutSheet);
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', placeOrder);
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

// Handle checkout form submission
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        items: cart.map(item => ({
            id: item.id,
            title: item.title,
            variant: item.variant,
            color: item.color,
            price: item.price,
            quantity: item.quantity
        })),
        subtotal: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        shipping: cart.reduce((total, item) => total + (item.price * item.quantity), 0) > 500000 ? 0 : 30000
    };
    
    formData.total = formData.subtotal + formData.shipping;
    
    // In a real application, we would send this data to a server
    console.log('Order submitted:', formData);
    
    // Show success message
    showNotification('Thank you for your order! Order has been placed successfully.', 'success', 5000);
    
    // Clear cart
    cart = [];
    updateCart();
    saveCart();
    
    // Close checkout sheet
    closeCheckoutSheet();
});

// Close checkout when clicking outside the sheet
checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) {
        closeCheckoutSheet();
    }
}); 