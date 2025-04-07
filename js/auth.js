document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showSignup = document.getElementById('showSignup');
    const signupForm = document.getElementById('signupForm');

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'block';
    });

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

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        try {
            const checkResponse = await fetch('/users');
            const text = await checkResponse.text();
            const users = text.trim().split('\n').map(line => line.split(':')[0]);

            if (users.includes(username)) {
                alert('Username already exists!');
                return;
            }

            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });

            if (response.ok) {
                alert('User registered successfully! Please login.');
                signupForm.style.display = 'none';
                registerForm.reset();
            } else {
                alert('Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Error during registration');
        }
    });
});