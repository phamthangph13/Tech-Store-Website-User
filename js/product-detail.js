document.addEventListener('DOMContentLoaded', () => {
    // Get the product ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        console.error('No product ID provided in URL');
        document.querySelector('.product-detail-container').innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>Sorry, the product you are looking for was not found.</p>
                <a href="products.html" class="add-to-cart-btn">Browse Products</a>
            </div>
        `;
        return;
    }
    
    // Call our API function to fetch the product
    fetchProductById(productId)
        .then(product => {
            if (!product) {
                throw new Error('Product not found');
            }
            
            // Update product details
            document.getElementById('product-breadcrumb-name').textContent = product.name;
            document.getElementById('product-category').textContent = getCategoryFromIds(product.category_ids);
            document.getElementById('product-title').textContent = product.name;
            
            // Format price with commas for better readability (e.g., 29,000,000)
            const formatPrice = (price) => {
                return parseInt(price).toLocaleString();
            };
            
            // Calculate and display discount
            const basePrice = parseInt(product.price);
            const discountPercent = parseInt(product.discount_percent);
            const discountPrice = product.discount_price;
            
            const discountDisplay = discountPercent > 0 ? 
                `<div class="original-price">₫${formatPrice(basePrice)}</div>
                 <div class="discount-badge">-${discountPercent}%</div>` : '';
            
            document.getElementById('product-price').innerHTML = `₫${formatPrice(discountPrice)} ${discountDisplay}`;
            document.getElementById('product-description').textContent = product.short_description || '';
            
            // Set main product image
            const mainImageUrl = product.image_urls && product.image_urls.length > 0 
                ? product.image_urls[0] 
                : (product.thumbnail || 'images/default-laptop.jpg');
            
            document.getElementById('main-product-image').style.backgroundImage = `url('${mainImageUrl}')`;
            
            // Create thumbnails for all images
            const thumbnailContainer = document.getElementById('thumbnail-container');
            thumbnailContainer.innerHTML = '';
            
            const imageUrls = product.image_urls || [product.thumbnail || 'images/default-laptop.jpg'];
            imageUrls.forEach((imageUrl, index) => {
                const thumb = document.createElement('div');
                thumb.classList.add('thumbnail');
                if (index === 0) thumb.classList.add('active');
                thumb.style.backgroundImage = `url('${imageUrl}')`;
                thumb.dataset.image = imageUrl;
                thumbnailContainer.appendChild(thumb);
            });
            
            // Update specifications table
            const specTable = document.querySelector('.spec-table');
            specTable.innerHTML = `
                <tr>
                    <td>Processor</td>
                    <td>${product.specs.cpu}</td>
                </tr>
                <tr>
                    <td>RAM</td>
                    <td>${product.specs.ram}</td>
                </tr>
                <tr>
                    <td>Storage</td>
                    <td>${product.specs.storage}</td>
                </tr>
                <tr>
                    <td>Display</td>
                    <td>${product.specs.display}</td>
                </tr>
                <tr>
                    <td>Graphics</td>
                    <td>${product.specs.gpu}</td>
                </tr>
            `;
            
            // Add variant selection if available
            const productInfo = document.querySelector('.product-info');
            if (product.variant_specs && product.variant_specs.length > 0) {
                const variantSelector = document.createElement('div');
                variantSelector.classList.add('variant-selector');
                variantSelector.innerHTML = `
                    <h3>Configuration Options</h3>
                    <div class="variant-options">
                        ${product.variant_specs.map((variant, index) => `
                            <div class="variant-option ${index === 1 ? 'active' : ''}" data-variant-index="${index}">
                                <div class="variant-name">${variant.name}</div>
                                <div class="variant-price">₫${formatPrice(variant.price - (variant.price * variant.discount_percent / 100))}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Insert variant selector before quantity selector
                const quantitySelector = document.querySelector('.quantity-selector');
                if (quantitySelector) {
                    productInfo.insertBefore(variantSelector, quantitySelector);
                }
                
                // Add event listeners to variant options
                setTimeout(() => {
                    const variantOptions = document.querySelectorAll('.variant-option');
                    variantOptions.forEach(option => {
                        option.addEventListener('click', function() {
                            variantOptions.forEach(o => o.classList.remove('active'));
                            this.classList.add('active');
                            
                            // Update specs based on selected variant
                            const variantIndex = parseInt(this.dataset.variantIndex);
                            const selectedVariant = product.variant_specs[variantIndex];
                            
                            // Update spec table
                            if (selectedVariant.specs) {
                                specTable.innerHTML = `
                                    <tr>
                                        <td>Processor</td>
                                        <td>${selectedVariant.specs.cpu}</td>
                                    </tr>
                                    <tr>
                                        <td>RAM</td>
                                        <td>${selectedVariant.specs.ram}</td>
                                    </tr>
                                    <tr>
                                        <td>Storage</td>
                                        <td>${selectedVariant.specs.storage}</td>
                                    </tr>
                                    <tr>
                                        <td>Display</td>
                                        <td>${selectedVariant.specs.display}</td>
                                    </tr>
                                    <tr>
                                        <td>Graphics</td>
                                        <td>${selectedVariant.specs.gpu}</td>
                                    </tr>
                                `;
                            }
                            
                            // Update price
                            const variantPrice = selectedVariant.price;
                            const variantDiscountPercent = selectedVariant.discount_percent;
                            const variantDiscountPrice = variantPrice - (variantPrice * variantDiscountPercent / 100);
                            
                            const variantDiscountDisplay = variantDiscountPercent > 0 ? 
                                `<div class="original-price">₫${formatPrice(variantPrice)}</div>
                                 <div class="discount-badge">-${variantDiscountPercent}%</div>` : '';
                            
                            document.getElementById('product-price').innerHTML = 
                                `₫${formatPrice(variantDiscountPrice)} ${variantDiscountDisplay}`;
                        });
                    });
                }, 100);
            }
            
            // Add color selection if available
            if (product.colors && product.colors.length > 0) {
                const colorSelector = document.createElement('div');
                colorSelector.classList.add('color-selector');
                colorSelector.innerHTML = `
                    <h3>Color Options</h3>
                    <div class="color-options">
                        ${product.colors.map((color, index) => `
                            <div class="color-option ${index === 0 ? 'active' : ''}" 
                                 data-color-index="${index}" 
                                 data-color-name="${color.name}"
                                 data-price-adjustment="${color.price_adjustment || 0}"
                                 style="background-color: ${color.code}">
                            </div>
                        `).join('')}
                    </div>
                    <div class="selected-color-name">Selected: ${product.colors[0].name}</div>
                `;
                
                // Insert color selector before quantity selector
                const quantitySelector = document.querySelector('.quantity-selector');
                if (quantitySelector) {
                    productInfo.insertBefore(colorSelector, quantitySelector);
                }
                
                // Add event listeners to color options
                setTimeout(() => {
                    const colorOptions = document.querySelectorAll('.color-option');
                    colorOptions.forEach(colorOption => {
                        colorOption.addEventListener('click', () => {
                            // Remove active class from all options
                            colorOptions.forEach(option => option.classList.remove('active'));
                            // Add active class to selected option
                            colorOption.classList.add('active');
                            
                            // Update selected color name
                            const colorName = colorOption.getAttribute('data-color-name');
                            document.querySelector('.selected-color-name').textContent = `Selected: ${colorName}`;
                            
                            // Get selected variant price
                            const selectedVariantElement = document.querySelector('.variant-option.active');
                            const selectedVariantIndex = selectedVariantElement ? parseInt(selectedVariantElement.dataset.variantIndex) : 0;
                            const selectedVariant = product.variant_specs && product.variant_specs.length > 0
                                ? product.variant_specs[selectedVariantIndex]
                                : { name: 'Standard', price: product.price, discount_percent: product.discount_percent };
                            
                            // Calculate price with color adjustment
                            const variantPrice = selectedVariant.price;
                            const variantDiscountPercent = selectedVariant.discount_percent;
                            const colorPriceAdjustment = parseInt(colorOption.getAttribute('data-price-adjustment') || 0);
                            
                            // Calculate discounted price
                            const discountedVariantPrice = variantPrice - (variantPrice * variantDiscountPercent / 100);
                            const finalPrice = discountedVariantPrice + colorPriceAdjustment;
                            
                            // Update displayed price
                            const priceElement = document.getElementById('product-price');
                            if (priceElement) {
                                const variantDiscountDisplay = variantDiscountPercent > 0 ? 
                                    `<div class="original-price">₫${formatPrice(variantPrice)}</div>
                                     <div class="discount-badge">-${variantDiscountPercent}%</div>` : '';
                                
                                priceElement.innerHTML = `₫${formatPrice(finalPrice)} ${variantDiscountDisplay}`;
                                
                                // Show color adjustment if any
                                if (colorPriceAdjustment !== 0) {
                                    const colorAdjustmentElement = document.createElement('div');
                                    colorAdjustmentElement.classList.add('color-price-adjustment');
                                    colorAdjustmentElement.textContent = `Color adjustment: ${colorPriceAdjustment > 0 ? '+' : ''}₫${formatPrice(colorPriceAdjustment)}`;
                                    colorAdjustmentElement.style.fontSize = '14px';
                                    colorAdjustmentElement.style.color = colorPriceAdjustment > 0 ? '#e74c3c' : '#27ae60';
                                    
                                    // Remove any existing adjustment info
                                    const existingAdjustment = document.querySelector('.color-price-adjustment');
                                    if (existingAdjustment) {
                                        existingAdjustment.remove();
                                    }
                                    
                                    priceElement.appendChild(colorAdjustmentElement);
                                } else {
                                    // Remove adjustment info if no adjustment
                                    const existingAdjustment = document.querySelector('.color-price-adjustment');
                                    if (existingAdjustment) {
                                        existingAdjustment.remove();
                                    }
                                }
                            }
                        });
                    });
                }, 100);
            }
            
            // Add thumbnails event listeners
            setTimeout(() => {
                const thumbnails = document.querySelectorAll('.thumbnail');
                thumbnails.forEach(thumb => {
                    thumb.addEventListener('click', function() {
                        thumbnails.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                        document.getElementById('main-product-image').style.backgroundImage = this.style.backgroundImage;
                    });
                });
            }, 100);
            
            // Update the description tab content
            const descriptionTab = document.getElementById('description');
            if (descriptionTab) {
                descriptionTab.innerHTML = `
                    <h3>Product Description</h3>
                    <p>${product.short_description || ''}</p>
                    
                    ${product.highlights && product.highlights.length > 0 ? `
                        <div class="product-highlights">
                            <h4>Highlights</h4>
                            <ul>
                                ${product.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${product.product_info && product.product_info.length > 0 ? 
                        product.product_info.map(info => `
                            <div class="product-info-section">
                                <h4>${info.title}</h4>
                                <p>${info.content}</p>
                            </div>
                        `).join('') : ''}
                `;
            }
            
            // Update the specifications tab with full specs
            const specificationsTab = document.getElementById('specifications');
            if (specificationsTab && product.specs) {
                specificationsTab.innerHTML = `
                    <h3>Technical Specifications</h3>
                    <div class="full-specs">
                        <table>
                            <tr>
                                <th colspan="2">Product Information</th>
                            </tr>
                            <tr>
                                <td>Brand</td>
                                <td>${product.brand || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Model</td>
                                <td>${product.model || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th colspan="2">Performance</th>
                            </tr>
                            <tr>
                                <td>Processor</td>
                                <td>${product.specs.cpu || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Graphics</td>
                                <td>${product.specs.gpu || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Memory</td>
                                <td>${product.specs.ram || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Storage</td>
                                <td>${product.specs.storage || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th colspan="2">Display</th>
                            </tr>
                            <tr>
                                <td>Screen</td>
                                <td>${product.specs.display || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th colspan="2">Other</th>
                            </tr>
                            <tr>
                                <td>Operating System</td>
                                <td>${product.specs.os || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Battery</td>
                                <td>${product.specs.battery || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Ports</td>
                                <td>${product.specs.ports ? product.specs.ports.join(', ') : 'N/A'}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }
            
            // Add video section if videos are available
            if (product.video_urls && product.video_urls.length > 0) {
                const videoSection = document.createElement('div');
                videoSection.classList.add('product-videos');
                videoSection.innerHTML = `
                    <h3>Product Videos</h3>
                    <div class="video-container">
                        ${product.video_urls.map(video => `
                            <div class="product-video">
                                <div class="video-wrapper">
                                    <video controls>
                                        <source src="${video}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>
                                    <a href="${video}" download class="video-download-btn">
                                        <i class="fas fa-download"></i> Download
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Insert after tabs
                const tabsSection = document.querySelector('.tabs');
                if (tabsSection) {
                    tabsSection.parentNode.insertBefore(videoSection, tabsSection.nextSibling);
                }
            }
            
            // Handle add to cart
            const addToCartButton = document.getElementById('detail-add-to-cart');
            if (addToCartButton) {
                addToCartButton.addEventListener('click', () => {
                    const quantity = parseInt(document.querySelector('.quantity-value').value);
                    
                    // Get selected variant
                    const selectedVariantElement = document.querySelector('.variant-option.active');
                    const selectedVariantIndex = selectedVariantElement ? parseInt(selectedVariantElement.dataset.variantIndex) : 0;
                    const selectedVariant = product.variant_specs && product.variant_specs.length > 0
                        ? product.variant_specs[selectedVariantIndex]
                        : { name: 'Standard', price: product.price, discount_percent: product.discount_percent };
                    
                    // Get selected color
                    const selectedColorElement = document.querySelector('.color-option.active');
                    const selectedColorIndex = selectedColorElement ? parseInt(selectedColorElement.dataset.colorIndex) : 0;
                    const selectedColor = product.colors && product.colors.length > 0
                        ? product.colors[selectedColorIndex]
                        : { name: 'Default', price_adjustment: 0 };
                    
                    // Calculate final price with variant and color adjustments
                    const variantPrice = selectedVariant.price;
                    const variantDiscountPercent = selectedVariant.discount_percent;
                    const colorPriceAdjustment = parseInt(selectedColor.price_adjustment || 0);
                    
                    const finalPrice = (variantPrice - (variantPrice * variantDiscountPercent / 100)) + colorPriceAdjustment;
                    
                    console.log('Adding to cart with details:', {
                        productId: product._id,
                        variant: selectedVariant.name,
                        color: selectedColor.name,
                        colorAdjustment: colorPriceAdjustment,
                        finalPrice: finalPrice
                    });
                    
                    // Create cart item
                    const cartItem = {
                        id: product._id,
                        title: product.name,
                        variant: selectedVariant.name,
                        color: selectedColor.name,
                        price: finalPrice,
                        original_price: variantPrice,
                        discount_percent: variantDiscountPercent,
                        color_adjustment: colorPriceAdjustment,
                        image: product.image_urls ? product.image_urls[0] : (product.thumbnail || 'images/default-laptop.jpg'),
                        quantity: quantity
                    };
                    
                    // Add to cart
                    addProductToCart(cartItem);
                    
                    // Show notification
                    showNotification(`${product.name} added to your cart!`);
                });
            }
            
            // Fetch related products based on category
            if (product.category_ids && product.category_ids.length > 0) {
                fetchProducts({ 
                    category: product.category_ids[0],
                    limit: 4
                }).then(result => {
                    // Filter out the current product
                    const relatedProducts = result.products.filter(p => p.id !== product._id).slice(0, 4);
                    displayRelatedProducts(relatedProducts);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching product:', error);
            document.querySelector('.product-detail-container').innerHTML = `
                <div class="error-message">
                    <h2>Product Not Found</h2>
                    <p>Sorry, the product you are looking for was not found.</p>
                    <a href="products.html" class="add-to-cart-btn">Browse Products</a>
                </div>
            `;
        });
        
    // Function to display related products
    function displayRelatedProducts(products) {
        const container = document.getElementById('related-products');
        if (!container) return;
        
        container.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            
            const discountBadge = product.discount_percent > 0 
                ? `<div class="discount-badge">-${product.discount_percent}%</div>` 
                : '';
            
            const formattedPrice = (price) => parseInt(price).toLocaleString();
            const priceDisplay = product.discount_percent > 0
                ? `
                    <div class="product-price">
                        ₫${formattedPrice(product.discount_price)}
                        <span class="original-price">₫${formattedPrice(product.price)}</span>
                    </div>
                `
                : `<div class="product-price">₫${formattedPrice(product.price)}</div>`;
            
            productCard.innerHTML = `
                <div class="product-img" style="background-image: url('${product.image}')">
                    ${discountBadge}
                    <div class="product-actions">
                        <button class="action-btn quick-view" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                            <span class="tooltip">Quick View</span>
                        </button>
                        <button class="action-btn add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="tooltip">Add to Cart</span>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.title}</h3>
                    ${priceDisplay}
                    <a href="product-detail.html?id=${product.id}" class="view-details">View Details</a>
                </div>
            `;
            
            container.appendChild(productCard);
        });
        
        // Add event listeners to related products buttons
        const quickViewButtons = container.querySelectorAll('.quick-view');
        quickViewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.id;
                const product = products.find(p => p.id === productId);
                if (product) {
                    showQuickViewModal(product);
                }
            });
        });
        
        const addToCartButtons = container.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.id;
                const product = products.find(p => p.id === productId);
                if (product) {
                    addProductToCart({
                        id: product.id,
                        title: product.title,
                        variant: 'Standard',
                        color: 'Default',
                        price: product.discount_price || product.price,
                        image: product.image,
                        quantity: 1
                    });
                    
                    showNotification(`${product.title} added to your cart!`);
                }
            });
        });
    }
    
    // Function to add item to cart
    function addProductToCart(item) {
        console.log('Adding to cart:', item);
        
        // Ensure the item has all required properties
        if (!item.id) {
            console.error('Cart item missing ID!', item);
            showNotification('Error adding product to cart: Missing ID', 'error');
            return;
        }
        
        // Get existing cart from local storage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Normalize the item ID to string for consistent comparison
        item.id = item.id.toString();
        
        // Check if similar item is already in cart
        const existingItemIndex = cart.findIndex(cartItem => 
            cartItem.id.toString() === item.id && 
            cartItem.variant === item.variant && 
            cartItem.color === item.color
        );
        
        if (existingItemIndex >= 0) {
            console.log('Updating existing cart item quantity');
            cart[existingItemIndex].quantity += item.quantity;
        } else {
            console.log('Adding new item to cart');
            cart.push(item);
        }
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Cart saved to localStorage:', cart);
        
        // Log detailed cart contents
        console.log('------- CART CONTENTS FROM DETAIL PAGE -------');
        console.table(cart); // Shows cart items in table format
        
        // Detailed log of each item
        cart.forEach((item, index) => {
            console.group(`Cart item #${index + 1} - ${item.title}`);
            console.log('ID:', item.id);
            console.log('Title:', item.title);
            console.log('Variant:', item.variant);
            console.log('Color:', item.color);
            console.log('Price:', item.price);
            console.log('Quantity:', item.quantity);
            console.log('Original price:', item.original_price || 'N/A');
            console.log('Discount percent:', item.discount_percent || 0);
            if (item.color_adjustment) {
                console.log('Color price adjustment:', item.color_adjustment);
            }
            console.groupEnd();
        });
        console.log('-------------------------------------------');
        
        // Update cart count in header
        updateCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    }
    
    // Function to update cart count in header
    function updateCartCount(count) {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
            if (count > 0) {
                cartCountElement.classList.add('active');
            } else {
                cartCountElement.classList.remove('active');
            }
        }
    }
    
    // Function to show notification
    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
    
    // Initialize cart count
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    updateCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    
    // Tab navigation
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            
            tabLinks.forEach(link => link.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Quantity selector
    const plusBtn = document.querySelector('.increase-qty');
    const minusBtn = document.querySelector('.decrease-qty');
    const quantityValue = document.querySelector('.quantity-value');
    
    if (plusBtn && minusBtn && quantityValue) {
        plusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityValue.value);
            quantityValue.value = quantity + 1;
        });
        
        minusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityValue.value);
            if (quantity > 1) {
                quantityValue.value = quantity - 1;
            }
        });
    }
}); 