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
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;
            
            // Form validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill out all fields', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Sending your message...', 'info');
            
            // Simulate API call with timeout
            setTimeout(() => {
                // In a real application, you would send the data to a server here
                console.log('Form Data:', { name, email, subject, message });
                
                // Show success message
                showNotification('Your message has been sent successfully! We will contact you soon.', 'success');
                
                // Reset form
                contactForm.reset();
            }, 1500);
        });
    }
    
    // Map interaction
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        // Add any map-specific interactions here if needed
        // For example, you could add a click handler to show a larger map
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