document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('Login form not found in the DOM');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!role) {
            showFeedback('Please select a role', false);
            return;
        }

        try {
            const response = await fetch('/users');
            const text = await response.text();
            const users = text.trim().split('\n').map(line => {
                const [u, p, r] = line.split(':');
                return { username: u, password: p, role: r };
            });

            const user = users.find(u => 
                u.username === username && 
                u.password === password && 
                u.role === role
            );

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showFeedback('Login successful', true);
                setTimeout(() => {
                    window.location.href = role === 'admin' ? 'admin.html' : 'staff.html';
                }, 1000);
            } else {
                showFeedback('Invalid credentials', false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showFeedback('Error during login', false);
        }
    });
});

function showFeedback(message, isSuccess) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${isSuccess ? 'success' : 'error'}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}