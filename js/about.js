// About page specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('About page loaded');
    
    // Add animation to value cards on scroll
    const valueCards = document.querySelectorAll('.value-card');
    if (valueCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        valueCards.forEach(card => {
            observer.observe(card);
        });
    }
    
    // Team member hover effect
    const teamMembers = document.querySelectorAll('.team-member');
    if (teamMembers.length > 0) {
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                member.classList.add('hovered');
            });
            
            member.addEventListener('mouseleave', () => {
                member.classList.remove('hovered');
            });
        });
    }
}); 