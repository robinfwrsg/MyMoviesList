const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let currentUser = null;
let currentMovie = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadTheme();
    displayWatchlist();
    setupModalClose();
    setupThemeToggle();
});

function checkAuthStatus() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const currentSession = localStorage.getItem('currentUser');
    
    if (currentSession && users[currentSession]) {
        currentUser = currentSession;
        updateAuthUI(true);
        hideAuthMessage();
    } else {
        updateAuthUI(false);
        showAuthMessage();
        document.getElementById('moviesGrid').innerHTML = '<p>Please sign in to view your watchlist.</p>';
        hideLoading();
    }
}

function updateAuthUI(isLoggedIn) {
    const authSection = document.getElementById('authSection');
    
    if (isLoggedIn) {
        authSection.innerHTML = `
            <div class="user-info">
                <span class="welcome-text">Welcome, ${currentUser}!</span>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="login.html" class="nav-link">Sign In</a>
            <a href="login.html" class="nav-link">Sign Up</a>
        `;
    }
}

function showAuthMessage() {
    document.getElementById('authMessage').style.display = 'block';
}

function hideAuthMessage() {
    document.getElementById('authMessage').style.display = 'none';
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateAuthUI(false);
    showAuthMessage();
    document.getElementById('moviesGrid').innerHTML = '<p>Please sign in to view your watchlist.</p>';
}

function displayWatchlist() {
    const watchlist = getUserWatchlist();
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = '';

    if (watchlist.length === 0) {
        moviesGrid.innerHTML = '<p>Your watchlist is empty. Add some movies!</p>';
        hideLoading();
        return;
    }

    watchlist.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });

    hideLoading();
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';

    card.innerHTML = `
        ${posterUrl ? 
            `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">` :
            `<div class="movie-poster">🎬</div>`
        }
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-year">${year}</p>
            <div class="movie-actions">
                <button class="action-btn watchlist-btn" onclick="removeFromWatchlist(${movie.id})">
                    Remove
                </button>
            </div>
        </div>
    `;

    card.addEventListener('click', () => showMovieDetails(movie));
    return card;
}

function getUserWatchlist() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watchlist || [];
}

function saveUserData(watchlist) {
    if (!currentUser) return;
    const userData = {
        watchlist: watchlist || getUserWatchlist(),
        watched: getUserWatched()
    };
    localStorage.setItem(`user_${currentUser}`, JSON.stringify(userData));
}

function getUserWatched() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watched || [];
}

function removeFromWatchlist(movieId) {
    let watchlist = getUserWatchlist();
    watchlist = watchlist.filter(movie => movie.id !== movieId);
    saveUserData(watchlist);
    displayWatchlist();
    if (currentMovie && currentMovie.id === movieId) {
        document.getElementById('detailsModal').style.display = 'none';
    }
}

function showMovieDetails(movie) {
    currentMovie = movie;
    document.getElementById('detailsMovieTitle').textContent = movie.title;
    document.getElementById('detailsYear').textContent = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
    document.getElementById('detailsOverview').textContent = movie.overview || 'No description available.';
    document.getElementById('detailsPoster').src = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '';
    document.getElementById('detailsPoster').style.display = movie.poster_path ? 'block' : 'none';
    document.getElementById('detailsModal').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function setupModalClose() {
    document.querySelector('.close').onclick = function() {
        document.getElementById('detailsModal').style.display = 'none';
    };

    window.onclick = function(event) {
        const modal = document.getElementById('detailsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
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