// Debug script to help diagnose data.json loading issues
document.addEventListener('DOMContentLoaded', async function() {
    console.log('--- FETCH DEBUG TOOL STARTED ---');
    
    try {
        // Create debug output element
        const debugDiv = document.createElement('div');
        debugDiv.id = 'fetch-debug';
        debugDiv.style.cssText = 'position:fixed; bottom:10px; right:10px; padding:10px; background:#f8f8f8; border:1px solid #ddd; border-radius:5px; z-index:9999; font-family:monospace; font-size:12px; max-width:80%; max-height:40%; overflow:auto; box-shadow:0 0 10px rgba(0,0,0,0.1);';
        
        document.body.appendChild(debugDiv);
        
        // Log function that writes to both console and debug div
        function log(message, type = 'info') {
            const colors = {
                info: '#333',
                success: 'green',
                error: 'red',
                warning: 'orange'
            };
            
            console.log(`[FETCH-DEBUG] ${message}`);
            
            const logLine = document.createElement('div');
            logLine.style.color = colors[type] || colors.info;
            logLine.style.marginBottom = '5px';
            logLine.style.borderBottom = '1px dotted #eee';
            logLine.textContent = message;
            
            debugDiv.appendChild(logLine);
            debugDiv.scrollTop = debugDiv.scrollHeight;
        }
        
        // Log environment info
        log('Current URL: ' + window.location.href);
        log('Base URL: ' + document.baseURI);
        log('Location origin: ' + window.location.origin);
        
        // Potential paths to try
        const possiblePaths = [
            './data.json',
            '../data.json',
            '/data.json',
            window.location.origin + '/data.json',
            window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'data.json'
        ];
        
        log('Will try these paths:');
        possiblePaths.forEach(path => log(`  - ${path}`));
        
        // Try each path
        let success = false;
        
        for (const path of possiblePaths) {
            try {
                log(`Trying: ${path}`);
                
                const fetchResponse = await fetch(path, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (fetchResponse.ok) {
                    success = true;
                    log(`✓ SUCCESS: Fetched from ${path}`, 'success');
                    
                    // Check content
                    const data = await fetchResponse.json();
                    log(`Data contains ${data.length} items`);
                    
                    if (data && data.length > 0) {
                        const firstItem = data[0];
                        log(`First item: ${JSON.stringify(firstItem).substring(0, 100)}...`);
                    }
                    
                    // Create a button to use this path
                    const useButton = document.createElement('button');
                    useButton.textContent = `Use ${path} for location data`;
                    useButton.style.cssText = 'margin-top:10px; padding:5px 10px; background:#3498db; color:white; border:none; border-radius:3px; cursor:pointer;';
                    useButton.onclick = function() {
                        localStorage.setItem('locationDataPath', path);
                        log(`Path ${path} saved to localStorage`, 'success');
                        setTimeout(() => window.location.reload(), 1000);
                    };
                    
                    debugDiv.appendChild(useButton);
                    break;
                } else {
                    log(`✗ FAILED: HTTP ${fetchResponse.status} from ${path}`, 'error');
                }
            } catch (error) {
                log(`✗ ERROR: ${error.message} when fetching ${path}`, 'error');
            }
        }
        
        if (!success) {
            log('Failed to fetch from any path', 'error');
            
            // Offer to upload a file
            log('Would you like to upload data.json file?', 'warning');
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            const uploadButton = document.createElement('button');
            uploadButton.textContent = 'Upload data.json file';
            uploadButton.style.cssText = 'margin-top:10px; padding:5px 10px; background:#e67e22; color:white; border:none; border-radius:3px; cursor:pointer; margin-right:10px;';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close debug panel';
            closeButton.style.cssText = 'margin-top:10px; padding:5px 10px; background:#95a5a6; color:white; border:none; border-radius:3px; cursor:pointer;';
            closeButton.onclick = function() {
                debugDiv.remove();
            };
            
            uploadButton.onclick = function() {
                fileInput.click();
            };
            
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            const data = JSON.parse(event.target.result);
                            log(`Parsed uploaded file, contains ${data.length} items`, 'success');
                            localStorage.setItem('locationData', JSON.stringify(data));
                            log('Data saved to localStorage', 'success');
                            setTimeout(() => window.location.reload(), 1000);
                        } catch (error) {
                            log(`Error parsing file: ${error.message}`, 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            });
            
            debugDiv.appendChild(uploadButton);
            debugDiv.appendChild(closeButton);
            debugDiv.appendChild(fileInput);
        }
    } catch (error) {
        console.error('Error in fetch debug tool:', error);
    }
}); 