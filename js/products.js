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
                case 'name-asc':
                    queryParams.append('sort_by', 'name');
                    queryParams.append('sort_order', 'asc');
                    break;
                case 'name-desc':
                    queryParams.append('sort_by', 'name');
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
                title: product.name,
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
                    case 'name-asc':
                        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
                        break;
                    case 'name-desc':
                        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
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

// Helper function to get category name from category IDs
function getCategoryFromIds(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
        return 'uncategorized';
    }
    
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
    
    // Return the first matching category or default to uncategorized
    for (const categoryId of categoryIds) {
        if (categoryIdMap[categoryId]) {
            return categoryIdMap[categoryId];
        }
    }
    
    return 'uncategorized';
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
    // Initialize with all products
    fetchProducts().then(result => {
        products = result.products;
        displayProducts('all');
    });
}); 