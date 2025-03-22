// Variables
let provinces = [];
let districts = [];
let wards = [];

// Debug function to trace network errors
function logFetchError(path, error) {
    console.error(`Failed to fetch from ${path}:`, error.message || error);
    return error;
}

// Utility function to check if DOM elements are loaded
function checkDomElements() {
    const elements = {
        provinceSelect: document.getElementById('province'),
        districtSelect: document.getElementById('district'),
        wardSelect: document.getElementById('ward')
    };
    
    return elements.provinceSelect && elements.districtSelect && elements.wardSelect;
}

// Fetch location data from data.json
async function fetchLocationData() {
    try {
        // Wait until all DOM elements are available
        if (!checkDomElements()) {
            console.log('DOM elements not ready yet, retrying in 100ms...');
            setTimeout(fetchLocationData, 100);
            return;
        }
        
        // Get references to DOM elements
        const provinceSelect = document.getElementById('province');
        const districtSelect = document.getElementById('district');
        const wardSelect = document.getElementById('ward');
        
        if (!provinceSelect || !districtSelect || !wardSelect) {
            console.log('DOM elements not found, aborting location dropdown initialization');
            return;
        }
        
        console.log('Fetching location data...');

        // Show loading state in the province dropdown
        const loadingOption = document.createElement('option');
        loadingOption.value = "";
        loadingOption.textContent = "Loading provinces...";
        clearDropdown(provinceSelect);
        provinceSelect.appendChild(loadingOption);
        provinceSelect.disabled = true;

        // Check if we have data in localStorage
        const storedData = localStorage.getItem('locationData');
        if (storedData) {
            try {
                console.log('Using location data from localStorage');
                const data = JSON.parse(storedData);
                provinces = data;
                
                // Initialize the dropdowns
                populateProvinces(provinceSelect);
                provinceSelect.disabled = false;
                provinceSelect.addEventListener('change', function() {
                    handleProvinceChange(provinceSelect, districtSelect, wardSelect);
                });
                districtSelect.addEventListener('change', function() {
                    handleDistrictChange(districtSelect, wardSelect);
                });
                
                return; // Exit early if we have data in localStorage
            } catch (e) {
                console.error('Failed to use localStorage data:', e);
                // Continue to fetch from file if localStorage parsing fails
            }
        }

        // If we have a saved path, use it
        const savedPath = localStorage.getItem('locationDataPath');
        if (savedPath) {
            try {
                console.log(`Using saved path: ${savedPath}`);
                const response = await fetch(savedPath);
                if (response.ok) {
                    const data = await response.json();
                    provinces = data;
                    
                    populateProvinces(provinceSelect);
                    provinceSelect.disabled = false;
                    provinceSelect.addEventListener('change', function() {
                        handleProvinceChange(provinceSelect, districtSelect, wardSelect);
                    });
                    districtSelect.addEventListener('change', function() {
                        handleDistrictChange(districtSelect, wardSelect);
                    });
                    
                    return; // Exit early if successful
                }
            } catch (e) {
                console.error(`Failed to fetch from saved path: ${savedPath}`, e);
                // Continue to try other methods if this fails
            }
        }

        // Log current location for debugging
        console.log('Current page URL:', window.location.href);
        console.log('Document base URL:', document.baseURI);
        
        // Potential paths to try
        const possiblePaths = [
            './data.json',
            '../data.json',
            '/data.json',
            window.location.origin + '/data.json',
            window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'data.json'
        ];
        
        console.log('Will try these paths:', possiblePaths);
        
        // Try each path
        let response = null;
        let lastError = null;
        
        for (const path of possiblePaths) {
            try {
                console.log(`Trying to fetch from: ${path}`);
                const fetchResponse = await fetch(path);
                if (fetchResponse.ok) {
                    response = fetchResponse;
                    console.log(`Successfully fetched from: ${path}`);
                    
                    // Save successful path for future use
                    localStorage.setItem('locationDataPath', path);
                    break;
                } else {
                    lastError = logFetchError(path, new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`));
                }
            } catch (error) {
                lastError = logFetchError(path, error);
            }
        }
        
        if (!response) {
            throw new Error(`Failed to fetch location data from any path. Last error: ${lastError?.message || 'Unknown error'}`);
        }
        
        // Parse the JSON data
        const data = await response.json();
        console.log('Location data fetched successfully:', data.length + ' provinces loaded');
        provinces = data;
        
        // Save to localStorage for future use
        try {
            localStorage.setItem('locationData', JSON.stringify(data));
            console.log('Location data saved to localStorage');
        } catch (e) {
            console.warn('Failed to save location data to localStorage:', e);
        }
        
        // Initialize provinces dropdown
        populateProvinces(provinceSelect);
        
        // Add event listeners for dropdown changes
        provinceSelect.disabled = false;
        provinceSelect.addEventListener('change', function() {
            handleProvinceChange(provinceSelect, districtSelect, wardSelect);
        });
        
        districtSelect.addEventListener('change', function() {
            handleDistrictChange(districtSelect, wardSelect);
        });
    } catch (error) {
        console.error('Error loading location data:', error);
        
        // Show error in province dropdown
        const provinceSelect = document.getElementById('province');
        if (provinceSelect) {
            const errorOption = document.createElement('option');
            errorOption.value = "";
            errorOption.textContent = "Error loading data";
            clearDropdown(provinceSelect);
            provinceSelect.appendChild(errorOption);
            provinceSelect.disabled = true;
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Error loading location data. Please try again.', 'error', 5000);
        }
    }
}

// Populate provinces dropdown
function populateProvinces(provinceSelect) {
    // Clear dropdown except first option
    clearDropdown(provinceSelect);
    
    // Temporarily disable animations for smoother loading
    provinceSelect.style.transition = "none";
    
    // Add a placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = "";
    placeholderOption.textContent = "Chọn Tỉnh/Thành phố";
    provinceSelect.appendChild(placeholderOption);
    
    // Add provinces to dropdown with a slight fade-in effect
    provinces.forEach((province, index) => {
        const option = document.createElement('option');
        option.value = province.Code;
        option.textContent = province.FullName;
        provinceSelect.appendChild(option);
    });
    
    // Re-enable animations after a short delay
    setTimeout(() => {
        provinceSelect.style.transition = "all 0.3s ease";
        
        // Add a subtle highlight effect
        provinceSelect.style.borderColor = "#3498db";
        provinceSelect.style.boxShadow = "0 0 0 3px rgba(52, 152, 219, 0.2)";
        
        // Reset after animation
        setTimeout(() => {
            provinceSelect.style.borderColor = "#e0e0e0";
            provinceSelect.style.boxShadow = "none";
        }, 1000);
    }, 50);
}

// Handle province selection change
function handleProvinceChange(provinceSelect, districtSelect, wardSelect) {
    const provinceCode = provinceSelect.value;
    
    // Disable ward dropdown
    wardSelect.disabled = true;
    wardSelect.value = '';
    clearDropdown(wardSelect);
    
    if (!provinceCode) {
        // If no province selected, disable district dropdown
        districtSelect.disabled = true;
        districtSelect.value = '';
        clearDropdown(districtSelect);
        return;
    }
    
    // Find selected province
    const selectedProvince = provinces.find(province => province.Code === provinceCode);
    
    if (selectedProvince && selectedProvince.District) {
        // Update districts array and populate districts dropdown
        districts = selectedProvince.District;
        populateDistricts(districtSelect);
        
        // Enable district dropdown
        districtSelect.disabled = false;
    } else {
        // If province has no districts, disable district dropdown
        districtSelect.disabled = true;
        districtSelect.value = '';
        clearDropdown(districtSelect);
    }
}

// Populate districts dropdown based on selected province
function populateDistricts(districtSelect) {
    // Clear dropdown except first option
    clearDropdown(districtSelect);
    
    // Add a placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = "";
    placeholderOption.textContent = "Chọn Quận/Huyện";
    districtSelect.appendChild(placeholderOption);
    
    // Add districts to dropdown
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.Code;
        option.textContent = district.FullName;
        districtSelect.appendChild(option);
    });
    
    // Add a subtle highlight effect
    districtSelect.style.borderColor = "#3498db";
    districtSelect.style.boxShadow = "0 0 0 3px rgba(52, 152, 219, 0.2)";
    
    // Reset after animation
    setTimeout(() => {
        districtSelect.style.borderColor = "#e0e0e0";
        districtSelect.style.boxShadow = "none";
    }, 1000);
}

// Handle district selection change
function handleDistrictChange(districtSelect, wardSelect) {
    const districtCode = districtSelect.value;
    
    if (!districtCode) {
        // If no district selected, disable ward dropdown
        wardSelect.disabled = true;
        wardSelect.value = '';
        clearDropdown(wardSelect);
        return;
    }
    
    // Find selected district
    const selectedDistrict = districts.find(district => district.Code === districtCode);
    
    if (selectedDistrict && selectedDistrict.Ward) {
        // Update wards array and populate wards dropdown
        wards = selectedDistrict.Ward;
        populateWards(wardSelect);
        
        // Enable ward dropdown
        wardSelect.disabled = false;
    } else {
        // If district has no wards, disable ward dropdown
        wardSelect.disabled = true;
        wardSelect.value = '';
        clearDropdown(wardSelect);
    }
}

// Populate wards dropdown based on selected district
function populateWards(wardSelect) {
    // Clear dropdown except first option
    clearDropdown(wardSelect);
    
    // Add a placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = "";
    placeholderOption.textContent = "Chọn Phường/Xã";
    wardSelect.appendChild(placeholderOption);
    
    // Add wards to dropdown
    wards.forEach(ward => {
        const option = document.createElement('option');
        option.value = ward.Code;
        option.textContent = ward.FullName;
        wardSelect.appendChild(option);
    });
    
    // Add a subtle highlight effect
    wardSelect.style.borderColor = "#3498db";
    wardSelect.style.boxShadow = "0 0 0 3px rgba(52, 152, 219, 0.2)";
    
    // Reset after animation
    setTimeout(() => {
        wardSelect.style.borderColor = "#e0e0e0";
        wardSelect.style.boxShadow = "none";
    }, 1000);
}

// Helper function to clear dropdown options
function clearDropdown(selectElement) {
    if (!selectElement) return;
    
    // Remove all existing options
    while (selectElement.options.length > 0) {
        selectElement.remove(0);
    }
}

// Get full location string for form submission
function getFullLocationString() {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    
    if (!provinceSelect || !districtSelect || !wardSelect) return '';
    
    const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || '';
    const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
    const provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
    
    // Filter out empty values
    const locationParts = [wardName, districtName, provinceName].filter(Boolean);
    
    // Join with commas
    return locationParts.join(', ');
}

// Initialize location data when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure app.js has initialized variables
    setTimeout(fetchLocationData, 200);
}); 