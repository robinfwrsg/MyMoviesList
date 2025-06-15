document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadTheme();
    setupThemeToggle();
    setupTabSwitching();
});

function checkAuthStatus() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const currentSession = localStorage.getItem('currentUser');
    
    if (currentSession && users[currentSession]) {
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }
}

function updateAuthUI(isLoggedIn) {
    const authSection = document.getElementById('authSection');
    
    if (isLoggedIn) {
        authSection.innerHTML = `
            <div class="user-info">
                <span class="welcome-text">Welcome, ${localStorage.getItem('currentUser')}!</span>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="login.html" class="nav-link active">Sign In</a>
            <a href="login.html" class="nav-link">Sign Up</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    updateAuthUI(false);
    window.location.href = 'index.html';
}

function setupTabSwitching() {
    const loginTab = document.querySelector('.tab[onclick="showTab(\'login\')"]');
    const signupTab = document.querySelector('.tab[onclick="showTab(\'signup\')"]');
    const loginForm = document.getElementById('login');
    const signupForm = document.getElementById('signup');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
    });
}

function showTab(tab) {
    const loginTab = document.querySelector('.tab[onclick="showTab(\'login\')"]');
    const signupTab = document.querySelector('.tab[onclick="showTab(\'signup\')"]');
    const loginForm = document.getElementById('login');
    const signupForm = document.getElementById('signup');

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
    }
}

function signIn() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');

    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields.';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[username] || users[username].password !== password) {
        errorElement.textContent = 'Invalid username or password.';
        return;
    }

    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
}

function signUp() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('signupError');

    if (!username || !password || !confirmPassword) {
        errorElement.textContent = 'Please fill in all fields.';
        return;
    }

    if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match.';
        return;
    }

    if (username.length < 3 || password.length < 6) {
        errorElement.textContent = 'Username must be at least 3 characters and password at least 6 characters.';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        errorElement.textContent = 'Username already exists.';
        return;
    }

    users[username] = { password, watchlist: [], watched: [] };
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', theme === 'dark');
}

function setupThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}