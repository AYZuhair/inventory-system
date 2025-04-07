document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Check if loginForm exists
    if (!loginForm) {
        console.error('Login form not found in the DOM');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

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
                window.location.href = role === 'admin' ? 'admin.html' : 'staff.html';
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error during login');
        }
    });
});