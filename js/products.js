// Product data management
let products = [];
const API_BASE_URL = 'http://localhost:5000/api';


// Function to fetch products from the API
async function fetchProducts(options = {}) {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Add search query if provided
        if (options.query) {
            queryParams.append('query', options.query);
        }
        
        // Add category filter if provided
        if (options.category && options.category !== 'all') {
            // For MongoDB ObjectId format validation (simple check)
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (isValidObjectId(options.category)) {
                // It's already a category ID, use it directly
                queryParams.append('category_ids', options.category);
                console.log(`Using category ID directly: ${options.category}`);
            } else {
                // It's a slug, convert to ID using our mapping
                // Use the reverse mapping to find the ID
                let categoryId = null;
                
                for (const [id, slug] of Object.entries(window.categoryIdMap || {})) {
                    if (slug === options.category) {
                        categoryId = id;
                        break;
                    }
                }
                
                // If we couldn't find it in the dynamic mapping, use the hardcoded fallback
                if (!categoryId) {
                    const fallbackCategoryMap = {
                        'gaming': '6600a1c3b6f4a2d4e8f3b131',
                        'business': '6600a1c3b6f4a2d4e8f3b132',
                        'ultrabook': '6600a1c3b6f4a2d4e8f3b130'
                    };
                    categoryId = fallbackCategoryMap[options.category];
                }
                
                if (categoryId) {
                    queryParams.append('category_ids', categoryId);
                    console.log(`Converted slug ${options.category} to ID: ${categoryId}`);
                } else {
                    console.warn(`Could not find category ID for: ${options.category}`);
                }
            }
        }
        
        // Add sorting if provided
        if (options.sort) {
            switch(options.sort) {
                case 'price-low':
                    queryParams.append('sort_by', 'price');
                    queryParams.append('sort_order', 'asc');
                    break;
                case 'price-high':
                    queryParams.append('sort_by', 'price');
                    queryParams.append('sort_order', 'desc');
                    break;
                default:
                    // Default sorting is by created_at
                    queryParams.append('sort_by', 'created_at');
                    queryParams.append('sort_order', 'desc');
            }
        }
        
        // Add pagination
        queryParams.append('page', options.page || 1);
        queryParams.append('limit', options.limit || 12);
        
        const apiUrl = `${API_BASE_URL}/product-search/?${queryParams.toString()}`;
        console.log(`Making API request to: ${apiUrl}`);
        
        try {
            // Attempt to connect to the API with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Increasing timeout to 5 seconds
            
            // Make the API request
            const response = await fetch(apiUrl, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Error fetching products: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`API returned ${data.products ? data.products.length : 0} products`);
            
            if (!data.products || data.products.length === 0) {
                console.log("API returned no products for the query");
                return {
                    products: [],
                    totalPages: 0,
                    currentPage: 1,
                    noProductsFound: true
                };
            }
            
            // Transform the API response to match our expected format
            products = data.products.map(product => ({
                id: product._id,
                title: product.name || '',
                category: getCategoryFromIds(product.category_ids),
                price: product.price *1, // Assuming price is in cents
                discount_percent: product.discount_percent || 0,
                discount_price: product.discount_price ? product.discount_price *1 : null, // Apply the same conversion
                image: product.thumbnail ? `${API_BASE_URL}/products/files/${product.thumbnail}` : 'images/default-laptop.jpg',
                description: getProductDescription(product)
            }));
            
            return {
                products,
                totalPages: data.pages,
                currentPage: data.page
            };
            
        } catch (apiError) {
            console.warn('API unavailable, falling back to sample data:', apiError);
            
            // Use sample data with client-side filtering
            let filteredProducts = [...sampleProducts];
            
            // Apply category filter
            if (options.category && options.category !== 'all') {
                // If it's a slug (string like 'gaming')
                if (typeof options.category === 'string' && 
                    (options.category === 'gaming' || options.category === 'business' || options.category === 'ultrabook')) {
                    filteredProducts = filteredProducts.filter(product => 
                        product.category === options.category
                    );
                } else {
                    // If it's a category ID, we need to check which products may be in this category
                    // For sample data, we'll use our hardcoded mapping to check
                    const reverseMap = {
                        '6600a1c3b6f4a2d4e8f3b130': 'ultrabook',
                        '6600a1c3b6f4a2d4e8f3b131': 'gaming',
                        '6600a1c3b6f4a2d4e8f3b132': 'business'
                    };
                    
                    const categorySlug = reverseMap[options.category];
                    if (categorySlug) {
                        filteredProducts = filteredProducts.filter(product =>
                            product.category === categorySlug
                        );
                    }
                }
            }
            
            // Apply search filter
            if (options.query) {
                const searchTerm = options.query.toLowerCase();
                filteredProducts = filteredProducts.filter(product => 
                    product.title.toLowerCase().includes(searchTerm) || 
                    product.description.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply sorting
            if (options.sort) {
                switch(options.sort) {
                    case 'price-low':
                        filteredProducts.sort((a, b) => a.price - b.price);
                        break;
                    case 'price-high':
                        filteredProducts.sort((a, b) => b.price - a.price);
                        break;
                    default:
                        // Default sort (by id)
                        filteredProducts.sort((a, b) => a.id - b.id);
                }
            }
            
            // Add discount information to sample data
            filteredProducts = filteredProducts.map(product => {
                if (!product.hasOwnProperty('discount_percent')) {
                    product.discount_percent = 0;
                }
                
                if (!product.hasOwnProperty('discount_price') && product.discount_percent > 0) {
                    product.discount_price = product.price - (product.price * product.discount_percent / 100);
                }
                
                return product;
            });
            
            // Set the products variable to our filtered sample data
            products = filteredProducts;
            
            return {
                products: filteredProducts,
                totalPages: 1,
                currentPage: 1,
                usingSampleData: true
            };
        }
        
    } catch (error) {
        console.error('Error in fetchProducts:', error);
        return {
            products: [],
            totalPages: 0,
            currentPage: 1
        };
    }
}

// New function to fetch a single product by ID
async function fetchProductById(productId) {
    try {
        // Validate productId format
        const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValidObjectId(productId)) {
            console.error('Invalid product ID format:', productId);
            return null;
        }
        
        console.log(`Fetching product details for ID: ${productId}`);
        const apiUrl = `${API_BASE_URL}/products/${productId}`;
        
        try {
            // Attempt to connect to the API with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            // Make the API request
            const response = await fetch(apiUrl, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Error fetching product: ${response.status}`);
            }
            
            // Parse the product data
            const product = await response.json();
            console.log('Successfully fetched product data:', product);
            
            // Process the image URLs to include the full path
            if (product.thumbnail) {
                product.thumbnail = `${API_BASE_URL}/products/files/${product.thumbnail}`;
            }
            
            // Transform image identifiers to full URLs if they exist
            if (product.images && product.images.length > 0) {
                product.image_urls = product.images.map(imageId => 
                    `${API_BASE_URL}/products/files/${imageId}`
                );
            }
            
            // Transform video identifiers to full URLs if they exist
            if (product.videos && product.videos.length > 0) {
                product.video_urls = product.videos.map(videoId => 
                    `${API_BASE_URL}/products/files/${videoId}`
                );
            }
            
            return product;
            
        } catch (apiError) {
            console.warn('API unavailable or error fetching product, searching in sample data:', apiError);
            
            // Try to find the product in the local sample data
            // First check if we already have loaded products
            if (products && products.length > 0) {
                const productMatch = products.find(p => p.id === productId);
                if (productMatch) {
                    return convertToDetailFormat(productMatch);
                }
            }
            
            // If not found in loaded products, check in sample products
            if (typeof sampleProducts !== 'undefined') {
                const sampleMatch = sampleProducts.find(p => p.id === productId);
                if (sampleMatch) {
                    return convertToDetailFormat(sampleMatch);
                }
            }
            
            // Last resort: try to load the hardcoded sample product (if available in your codebase)
            return getSampleProductData(productId);
        }
    } catch (error) {
        console.error('Error in fetchProductById:', error);
        return null;
    }
}

// Helper function to convert from our frontend product format to detail format
function convertToDetailFormat(product) {
    // This function converts a product from the list format to the detail format if needed
    // For example, in some implementations these might have different structures
    
    // Return a format matching what the API would return
    return {
        _id: product.id,
        name: product.title,
        price: product.price,
        discount_percent: product.discount_percent,
        discount_price: product.discount_price,
        thumbnail: product.image,
        image_urls: [product.image], // We might only have one image in this case
        // Add other properties as needed
        specs: extractSpecs(product.description),
        short_description: product.description,
        // Add placeholder data for properties we don't have
        brand: "Sample Brand",
        model: "Sample Model",
        stock_quantity: 10,
        status: "available",
        category_ids: [],
        variant_specs: [],
        colors: [
            { name: "Default", code: "#000000", price_adjustment: 0 }
        ],
        highlights: []
    };
}

// Helper function to extract specs from description string
function extractSpecs(description) {
    // This is a simple parser that tries to extract specs from a description string
    // In a real app, you'd have proper structured data
    
    // Default specs
    const specs = {
        cpu: "Unknown",
        ram: "Unknown",
        storage: "Unknown",
        display: "Unknown",
        gpu: "Unknown",
        battery: "Unknown",
        os: "Windows",
        ports: ["USB"]
    };
    
    // Try to parse some specs from the description
    if (description) {
        const parts = description.split(',');
        if (parts.length >= 4) {
            specs.cpu = parts[0].trim();
            specs.ram = parts[1].trim();
            specs.storage = parts[2].trim();
            specs.gpu = parts[3].trim();
        }
    }
    
    return specs;
}

// Sample product data for fallback
function getSampleProductData(productId) {
    // This is a fallback function that returns hardcoded sample data
    return {
        _id: productId,
        name: "Laptop Dell XPS 15",
        brand: "Dell",
        model: "XPS 15 9530",
        price: 29000000,
        discount_percent: 5,
        discount_price: 27550000,
        stock_quantity: 10,
        status: "available",
        category_ids: ["6600a1c3b6f4a2d4e8f3b131"],
        thumbnail: "images/dell-xps15-1.webp",
        image_urls: [
            "images/dell-xps15-1.webp",
            "images/dell-xps15-2.webp", 
            "images/dell-xps15-3.webp",
            "images/dell-xps15-4.webp"
        ],
        video_urls: [
            "videos/dell-xps15-video1.mp4",
            "videos/dell-xps15-video2.mp4"
        ],
        short_description: "Premium ultrabook with stunning display and powerful performance",
        specs: {
            cpu: "Intel Core i7-13700H",
            ram: "16GB DDR5",
            storage: "512GB NVMe SSD",
            display: "15.6 inch 4K OLED",
            gpu: "NVIDIA RTX 4060 6GB",
            battery: "86Wh",
            os: "Windows 11 Pro",
            ports: ["Thunderbolt 4", "USB-C", "HDMI", "SD Card Reader"]
        },
        highlights: [
            "Premium build quality", 
            "High-performance components", 
            "Stunning 4K OLED display"
        ],
        product_info: [
            {
                title: "Design",
                content: "Sleek aluminum design with carbon fiber palm rest"
            },
            {
                title: "Performance",
                content: "High-performance laptop for professionals and content creators"
            }
        ],
        variant_specs: [
            {
                name: "High Performance",
                specs: {
                    cpu: "Intel Core i9",
                    ram: "32GB DDR5",
                    storage: "1TB NVMe SSD",
                    display: "15.6 inch 4K OLED Touch",
                    gpu: "NVIDIA RTX 4070 8GB",
                    battery: "86Wh",
                    os: "Windows 11 Pro",
                    ports: ["Thunderbolt 4", "USB-C", "HDMI", "SD Card Reader"]
                },
                price: 35000000,
                discount_percent: 0
            },
            {
                name: "Standard",
                specs: {
                    cpu: "Intel Core i7-13700H",
                    ram: "16GB DDR5",
                    storage: "512GB NVMe SSD",
                    display: "15.6 inch 4K OLED",
                    gpu: "NVIDIA RTX 4060 6GB",
                    battery: "86Wh",
                    os: "Windows 11 Pro",
                    ports: ["Thunderbolt 4", "USB-C", "HDMI", "SD Card Reader"]
                },
                price: 29000000,
                discount_percent: 5
            }
        ],
        colors: [
            {
                name: "Grey",
                code: "#b1a0a0",
                price_adjustment: 150000,
                discount_adjustment: 0,
                images: []
            },
            {
                name: "Black",
                code: "#000000",
                price_adjustment: 0,
                discount_adjustment: 0,
                images: []
            },
            {
                name: "Red",
                code: "#de0d0d",
                price_adjustment: 50000,
                discount_adjustment: 0,
                images: []
            }
        ]
    };
}

// Helper function to get category name from category IDs
function getCategoryFromIds(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
        console.warn('Product has no category IDs, showing as uncategorized');
        return 'uncategorized';
    }
    
    console.log('Getting category for IDs:', categoryIds);
    
    // For the demo, we'll use a simplified mapping
    // In a real application, you would fetch this from the API
    // and maintain a category cache
    
    // Map backend category IDs to our UI categories
    // This mapping will be updated dynamically when categories are loaded
    const categoryIdMap = window.categoryIdMap || {
        '6600a1c3b6f4a2d4e8f3b130': 'ultrabook',
        '6600a1c3b6f4a2d4e8f3b131': 'gaming',
        '6600a1c3b6f4a2d4e8f3b132': 'business'
    };
    
    console.log('Using category map:', categoryIdMap);
    
    // Return the first matching category or default to uncategorized
    for (const categoryId of categoryIds) {
        // If it's an object with an _id field (MongoDB document)
        const id = typeof categoryId === 'object' && categoryId._id ? categoryId._id : categoryId;
        
        // Convert to string for consistent comparison
        const idStr = id.toString();
        
        if (categoryIdMap[idStr]) {
            console.log(`Found category mapping: ${idStr} -> ${categoryIdMap[idStr]}`);
            return categoryIdMap[idStr];
        }
    }
    
    // If we reach here, no matching category was found
    console.warn('No matching category found for IDs:', categoryIds);
    
    // Return the string value of the first category ID as fallback
    // This ensures we at least have something to display/filter by
    const firstCategoryId = categoryIds[0];
    return typeof firstCategoryId === 'object' && firstCategoryId.name 
        ? firstCategoryId.name.toLowerCase().replace(/\s+/g, '-')
        : 'uncategorized';
}

// Helper function to generate a description from product specs
function getProductDescription(product) {
    if (!product.specs) {
        return 'No specifications available';
    }
    
    const specs = product.specs;
    return `${specs.cpu || ''}, ${specs.ram || ''}, ${specs.storage || ''}, ${specs.gpu || ''}`.trim();
}

// Function to fetch categories from the API
async function fetchCategories() {
    try {
        // Attempt to connect to the API with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Increase timeout to 5 seconds
        
        const categoriesUrl = `${API_BASE_URL}/categories/`;
        console.log(`Fetching categories from: ${categoriesUrl}`);
        
        // Make the API request
        const response = await fetch(categoriesUrl, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error fetching categories: ${response.status}`);
        }
        
        const categories = await response.json();
        console.log(`API returned ${categories.length} categories:`, categories);
        
        // Create a new mapping for category IDs to slugs
        const categoryIdMap = {};
        const categoryButtons = [];
        
        // Always add the "All" category first (this is kept as requested)
        categoryButtons.push({
            id: 'all',
            name: 'All',
            slug: 'all',
            icon: 'fa-laptop'
        });
        
        // Add all other categories from the API
        categories.forEach(category => {
            // Convert category name to a slug (lowercase, replace spaces with dashes)
            const slug = category.name.toLowerCase().replace(/\s+/g, '-');
            
            // Add to the mapping - make sure to handle MongoDB ObjectIds as strings
            const categoryId = category._id.toString();
            categoryIdMap[categoryId] = slug;
            
            console.log(`Added category mapping: ${categoryId} -> ${slug}`);
            
            // Determine icon based on category name (can be customized)
            let icon = 'fa-laptop';
            if (category.name.toLowerCase().includes('gaming')) icon = 'fa-gamepad';
            if (category.name.toLowerCase().includes('business')) icon = 'fa-briefcase';
            if (category.name.toLowerCase().includes('ultrabook')) icon = 'fa-feather-alt';
            
            // Add to the buttons array
            categoryButtons.push({
                id: categoryId,
                name: category.name,
                slug: slug,
                icon: icon
            });
        });
        
        // Save the category map globally
        window.categoryIdMap = categoryIdMap;
        console.log("Global category map updated:", window.categoryIdMap);
        
        return {
            categories: categoryButtons,
            usingSampleCategories: false
        };
        
    } catch (error) {
        console.warn('Error fetching categories, using sample data:', error);
        
        // Return sample categories if API fails
        return {
            categories: [
                { id: 'all', name: 'All', slug: 'all', icon: 'fa-laptop' },
                { id: '6600a1c3b6f4a2d4e8f3b131', name: 'Gaming', slug: 'gaming', icon: 'fa-gamepad' },
                { id: '6600a1c3b6f4a2d4e8f3b132', name: 'Business', slug: 'business', icon: 'fa-briefcase' },
                { id: '6600a1c3b6f4a2d4e8f3b130', name: 'Ultrabook', slug: 'ultrabook', icon: 'fa-feather-alt' }
            ],
            usingSampleCategories: true
        };
    }
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    // First, load categories and populate filter buttons
    const categoryFilter = document.getElementById('category-filter');
    
    if (categoryFilter) {
        fetchCategories().then(result => {
            // Clear existing buttons (keep the container)
            categoryFilter.innerHTML = '';
            
            // Add each category button
            result.categories.forEach(category => {
                const button = document.createElement('button');
                button.classList.add('filter-btn');
                if (category.slug === 'all') {
                    button.classList.add('active');
                }
                button.setAttribute('data-category', category.slug);
                button.innerHTML = `<i class="fas ${category.icon}"></i> ${category.name}`;
                categoryFilter.appendChild(button);
            });
            
            // Update global category mapping for product display
            console.log("Category mapping updated");
        }).catch(error => {
            console.error('Error loading categories:', error);
            // Keep default "All" button if categories fail to load
        });
    }
    
    // Then initialize with all products
    fetchProducts().then(result => {
        products = result.products;
        console.log('Products loaded:', products ? products.length : 0, 'items');
        
        // Debug: Log all product IDs to identify the issue
        if (products && products.length > 0) {
            console.log('Available Product IDs:', products.map(p => p.id));
            console.log('First product sample:', products[0]);
        }
        
        if (!products || !products.length) {
            // If no products from API, use sample data as fallback
            console.log('No products loaded from API, using sample data');
            
            // Define some sample products if needed
            if (typeof sampleProducts === 'undefined' || !sampleProducts.length) {
                console.log('Creating sample products array');
                window.sampleProducts = [
                    {
                        id: "1", // Convert to string to match API format
                        title: "Dell XPS 13",
                        category: "ultrabook",
                        price: 25000000,
                        discount_percent: 10,
                        discount_price: 22500000,
                        image: "images/dell-xps13.jpg",
                        description: "Intel Core i7, 16GB RAM, 512GB SSD, 13.4-inch FHD+ Display"
                    },
                    {
                        id: "2", // Convert to string to match API format
                        title: "MacBook Pro 14",
                        category: "ultrabook",
                        price: 35000000,
                        discount_percent: 0,
                        image: "images/macbook-pro.jpg",
                        description: "Apple M1 Pro, 16GB RAM, 512GB SSD, 14-inch Liquid Retina XDR Display"
                    },
                    {
                        id: "3", // Convert to string to match API format
                        title: "Alienware m15",
                        category: "gaming",
                        price: 40000000,
                        discount_percent: 15,
                        discount_price: 34000000,
                        image: "images/alienware-m15.jpg",
                        description: "Intel Core i9, 32GB RAM, 1TB SSD, NVIDIA RTX 3080, 15.6-inch QHD Display"
                    }
                ];
            }
            
            products = window.sampleProducts;
        }
        
        displayProducts('all');
    }).catch(error => {
        console.error('Error initializing products:', error);
        // Fallback to sample data in case of error
        products = window.sampleProducts || [];
        displayProducts('all');
    });
    
    // Add event listeners for filter buttons (category buttons)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn') || e.target.closest('.filter-btn')) {
            const button = e.target.classList.contains('filter-btn') ? e.target : e.target.closest('.filter-btn');
            
            // Remove active class from all filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get category from data attribute
            const category = button.getAttribute('data-category');
            
            // Display products of the selected category
            displayProducts(category);
        }
    });
    
    // Add event listener for sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortValue = this.value;
            const activeCategory = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
            
            // Fetch products with sorting option
            fetchProducts({
                category: activeCategory,
                sort: sortValue,
                query: document.getElementById('search-input')?.value || ''
            }).then(result => {
                products = result.products;
                displayProducts(activeCategory);
            }).catch(error => {
                console.error('Error sorting products:', error);
            });
        });
    }
    
    // Add event listeners for search
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn && searchInput) {
        // Search button click handler
        searchBtn.addEventListener('click', performSearch);
        
        // Enter key press handler
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    // Function to perform search
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        const activeCategory = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
        const sortValue = sortSelect?.value || 'default';
        
        // Fetch products with search query
        fetchProducts({
            category: activeCategory,
            sort: sortValue,
            query: searchTerm
        }).then(result => {
            products = result.products;
            displayProducts(activeCategory);
            
            // Show message if no results found
            if (products.length === 0) {
                const productGrid = document.querySelector('.product-grid');
                if (productGrid) {
                    productGrid.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-search"></i>
                            <p>No products found matching "${searchTerm}"</p>
                            <button class="btn" onclick="location.reload()">Show All Products</button>
                        </div>
                    `;
                }
            }
        }).catch(error => {
            console.error('Error searching products:', error);
        });
    }
}); 