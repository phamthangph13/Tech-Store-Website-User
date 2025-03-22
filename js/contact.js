// Contact page specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Contact page loaded');
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                // Close all other FAQs
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle the clicked FAQ
                item.classList.toggle('active');
            });
        });
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Form validation
            if (!name || !email || !subject || !message) {
                showNotification('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Vui lòng nhập địa chỉ email hợp lệ', 'error');
                return;
            }
            
            // Show sending notification
            showNotification('Đang gửi tin nhắn của bạn...', 'info');
            
            // Prepare data for API call
            const formData = {
                name,
                email,
                phone,
                subject,
                message
            };
            
            // Call the API using the same base URL as the product API
            fetch('http://localhost:5000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    // Handle HTTP error status
                    if (response.status === 429) {
                        throw new Error('rate_limit_exceeded');
                    }
                    return response.json().then(data => {
                        throw data;
                    }).catch(e => {
                        // If JSON parsing fails, throw a generic error with the status
                        throw new Error(`Server error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Show success message
                    showNotification(data.message || 'Tin nhắn của bạn đã được gửi thành công!', 'success');
                    
                    // Reset form
                    contactForm.reset();
                } else {
                    // Handle API logical error
                    throw data;
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                
                // Handle different error types
                if (error === 'rate_limit_exceeded' || (error.error && error.error === 'rate_limit_exceeded')) {
                    showNotification('Quá nhiều yêu cầu. Vui lòng thử lại sau.', 'error');
                } else if (error.error && error.error === 'validation_error') {
                    // Handle validation errors
                    const fieldErrors = error.fields;
                    const firstError = Object.values(fieldErrors)[0];
                    showNotification(firstError || 'Vui lòng kiểm tra lại thông tin đã nhập', 'error');
                } else if (error.error && error.error === 'server_error') {
                    showNotification(error.message || 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.', 'error');
                } else {
                    showNotification('Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.', 'error');
                }
            });
        });
    }
    
    // Map interaction
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        // Add any map-specific interactions here if needed
        mapContainer.addEventListener('click', () => {
            console.log('Map clicked');
        });
    }
    
    // Function to show notification (assuming the app.js has this function, otherwise define it here)
    function showNotification(message, type = 'success', duration = 3000) {
        const notification = document.getElementById('notification');
        
        // Clear any existing notifications
        notification.className = 'notification';
        notification.classList.add(type);
        
        // Set notification content
        notification.innerHTML = `
            <div class="notification-icon"></div>
            <div class="notification-message">${message}</div>
            <div class="notification-progress"></div>
        `;
        
        // Show the notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
}); 