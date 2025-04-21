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
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('role', result.role);
                showFeedback('Login successful', true);
                setTimeout(() => {
                    window.location.href = result.role === 'admin' ? 'admin.html' : 'staff.html';
                }, 1000);
            } else {
                showFeedback(result.error || 'Invalid credentials', false);
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