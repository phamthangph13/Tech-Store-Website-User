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
    displayProducts('all');
    updateCart();
    
    // Add missing product images with placeholder
    addPlaceholderImages();
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
    productGrid.innerHTML = '';
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        
        productCard.innerHTML = `
            <div class="product-image" style="background-image: url('${product.image}')"></div>
            <div class="product-info">
                <div class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
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

// Add item to cart
function addToCart(event) {
    const productId = parseInt(event.target.getAttribute('data-id'));
    const product = products.find(p => p.id === productId);
    
    // Check if item is already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
            variant: 'Standard', // Default variant
            color: 'Default'     // Default color
        });
    }
    
    // Update cart and localStorage
    updateCart();
    saveCart();
    showNotification(`${product.title} added to cart`);
}

// Update cart display
function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
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
            
            cartItem.innerHTML = `
                <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    ${variantDisplay}
                    <div class="cart-item-price">₫${parseInt(item.price).toLocaleString()}</div>
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
    cartTotalPrice.textContent = parseInt(totalPrice).toLocaleString();
    
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

// Increase item quantity
function increaseQuantity(event) {
    const productId = parseInt(event.target.getAttribute('data-id'));
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    const item = cart.find(item => 
        item.id === productId && 
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
    const productId = parseInt(event.target.getAttribute('data-id'));
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    const item = cart.find(item => 
        item.id === productId && 
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
    const productId = parseInt(event.target.getAttribute('data-id'));
    const variant = event.target.getAttribute('data-variant');
    const color = event.target.getAttribute('data-color');
    
    removeItemFromCart(productId, variant, color);
}

// Remove item from cart helper
function removeItemFromCart(productId, variant, color) {
    cart = cart.filter(item => 
        !(item.id === productId && 
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

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Checkout functionality
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    // In a real application, this would redirect to a checkout page
    // or show a modal for payment details
    const total = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    alert(`Thank you for your purchase! Total: $${total.toFixed(2)}`);
    
    // Clear cart after checkout
    cart = [];
    updateCart();
    saveCart();
    cartSidebar.classList.remove('open');
    showNotification('Your order has been placed');
}); 