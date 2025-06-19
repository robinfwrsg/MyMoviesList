const API_KEY = 'dda93467460f30c868fbb4400c1049e4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let movies = [];
let currentUser = null;
let currentRatingMovie = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadTheme();
    setupSearchListener();
    loadSearchResults();
    setupModalClose();
    setupThemeToggle();
});

function checkAuthStatus() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const currentSession = localStorage.getItem('currentUser');
    
    if (currentSession && users[currentSession]) {
        currentUser = currentSession;
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
        showAuthMessage();
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
        hideAuthMessage();
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
    displayMovies(movies);
}

function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('Please enter a search term.');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('searchSubtitle').textContent = `Results for "${query}"`;

    try {
        const response = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}`);
        const data = await response.json();
        movies = data.results;
        displayMovies(movies);
        hideLoading();
    } catch (error) {
        console.error('Error searching movies:', error);
        document.getElementById('moviesGrid').innerHTML = '<p>Error loading search results. Please try again.</p>';
        hideLoading();
    }
}

function loadSearchResults() {
    const query = localStorage.getItem('searchQuery');
    if (query) {
        document.getElementById('searchInput').value = query;
        performSearch();
        localStorage.removeItem('searchQuery');
    }
}

function displayMovies(movieList) {
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = '';

    movieList.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';

    const userWatchlist = getUserWatchlist();
    const userWatched = getUserWatched();
    const isInWatchlist = userWatchlist.some(item => item.id === movie.id);
    const isWatched = userWatched.some(item => item.id === movie.id);

    card.innerHTML = `
        ${posterUrl ? 
            `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">` :
            `<div class="movie-poster">🎬</div>`
        }
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-year">${year}</p>
            ${currentUser ? `
                <div class="movie-actions">
                    <button class="action-btn watchlist-btn ${isInWatchlist ? 'added' : ''}" 
                            onclick="toggleWatchlist(${movie.id})">
                        ${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
                    </button>
                    <button class="action-btn watched-btn ${isWatched ? 'watched' : ''}" 
                            onclick="toggleWatched(${movie.id})">
                        ${isWatched ? '✓ Watched' : 'Mark Watched'}
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

function getUserWatchlist() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watchlist || [];
}

function getUserWatched() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watched || [];
}

function saveUserData(watchlist, watched) {
    if (!currentUser) return;
    const userData = {
        watchlist: watchlist || getUserWatchlist(),
        watched: watched || getUserWatched()
    };
    localStorage.setItem(`user_${currentUser}`, JSON.stringify(userData));
}

function toggleWatchlist(movieId) {
    if (!currentUser) {
        alert('Please sign in to add movies to your watchlist.');
        return;
    }

    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    let watchlist = getUserWatchlist();
    const existingIndex = watchlist.findIndex(item => item.id === movieId);
    
    if (existingIndex > -1) {
        watchlist.splice(existingIndex, 1);
    } else {
        watchlist.push(movie);
    }

    saveUserData(watchlist, null);
    displayMovies(movies);
}

function toggleWatched(movieId) {
    if (!currentUser) {
        alert('Please sign in to mark movies as watched.');
        return;
    }

    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    let watched = getUserWatched();
    const existingIndex = watched.findIndex(item => item.id === movieId);
    
    if (existingIndex > -1) {
        watched.splice(existingIndex, 1);
        saveUserData(null, watched);
        displayMovies(movies);
    } else {
        currentRatingMovie = movie;
        document.getElementById('ratingMovieTitle').textContent = movie.title;
        document.getElementById('ratingModal').style.display = 'block';
        setupStarRating();
    }
}
function setupStarRating() {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const value = parseInt(this.getAttribute('data-value'));
            // Reset all stars
            stars.forEach(s => s.classList.remove('selected'));
            // Apply selected class only up to the clicked value
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('selected');
            }
            document.getElementById('movieRating').value = value;
        });
        // Optional: Handle hover for visual feedback (remove if not desired)
        star.addEventListener('mouseover', function() {
            const value = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => s.classList.remove('hover'));
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('hover');
            }
        });
        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hover'));
            const currentValue = parseInt(document.getElementById('movieRating').value) || 0;
            for (let i = 0; i < currentValue; i++) {
                stars[i].classList.add('selected');
            }
        });
    });
}

function submitRating() {
    const rating = parseFloat(document.getElementById('movieRating').value);
    const review = document.getElementById('movieReview').value.trim();
    
    if (!rating || rating < 1 || rating > 10) {
        alert('Please select a rating between 1 and 10.');
        return;
    }

    if (!currentRatingMovie) return;

    let watched = getUserWatched();
    const movieWithRating = {
        ...currentRatingMovie,
        userRating: rating,
        userReview: review || undefined, // Save review only if provided
        watchedDate: new Date().toISOString()
    };
    
    watched.push(movieWithRating);
    saveUserData(null, watched);
    
    document.getElementById('ratingModal').style.display = 'none';
    document.getElementById('movieRating').value = '';
    document.getElementById('movieReview').value = '';
    document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
    currentRatingMovie = null;
    displayMovies(movies);
}


function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function setupModalClose() {
    document.querySelector('.close').onclick = function() {
        document.getElementById('ratingModal').style.display = 'none';
        document.getElementById('movieRating').value = '';
        document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
    };

    window.onclick = function(event) {
        const modal = document.getElementById('ratingModal');
        if (event.target === modal) {
            modal.style.display = 'none';
            document.getElementById('movieRating').value = '';
            document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
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
