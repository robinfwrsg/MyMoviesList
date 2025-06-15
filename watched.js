const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let currentUser = null;
let currentEditMovie = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadTheme();
    displayWatched();
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
        document.getElementById('moviesGrid').innerHTML = '<p>Please sign in to view your watched movies.</p>';
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
    document.getElementById('moviesGrid').innerHTML = '<p>Please sign in to view your watched movies.</p>';
}

function displayWatched() {
    const watched = getUserWatched();
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = '';

    if (watched.length === 0) {
        moviesGrid.innerHTML = '<p>You haven’t watched any movies yet.</p>';
        hideLoading();
        return;
    }

    watched.forEach(movie => {
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
    const rating = movie.userRating || 'N/A';
    const review = movie.userReview || 'No review provided.';
    const watchedDate = movie.watchedDate ? new Date(movie.watchedDate).toLocaleDateString() : 'Unknown';

    const stars = Math.round(rating);
    let starHTML = '';
    for (let i = 1; i <= 10; i++) {
        starHTML += `<span class="star ${i <= stars ? 'filled' : ''}">★</span>`;
    }

    card.innerHTML = `
        ${posterUrl ? 
            `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">` :
            `<div class="movie-poster">🎬</div>`
        }
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-year">${year}</p>
            <div class="movie-rating">Rating: <span class="star-rating">${starHTML}</span></div>
            <p class="movie-review">${review}</p>
            <p class="movie-watched-date">Watched on: ${watchedDate}</p>
            <div class="movie-actions">
                <button class="action-btn edit-btn" onclick="editMovie(${movie.id})">Edit Rating/Review</button>
                <button class="action-btn remove-btn" onclick="removeFromWatched(${movie.id})">Remove</button>
            </div>
        </div>
    `;

    return card;
}

function getUserWatched() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watched || [];
}

function saveUserData(watched) {
    if (!currentUser) return;
    const userData = {
        watchlist: getUserWatchlist(),
        watched: watched || getUserWatched()
    };
    localStorage.setItem(`user_${currentUser}`, JSON.stringify(userData));
}

function getUserWatchlist() {
    if (!currentUser) return [];
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
    return userData.watchlist || [];
}

function removeFromWatched(movieId) {
    let watched = getUserWatched();
    watched = watched.filter(movie => movie.id !== movieId);
    saveUserData(watched);
    displayWatched();
}

function editMovie(movieId) {
    const watched = getUserWatched();
    const movie = watched.find(m => m.id === movieId);
    if (!movie) return;

    currentEditMovie = movie;
    document.getElementById('editMovieTitle').textContent = movie.title;
    document.getElementById('movieRating').value = movie.userRating || '';
    document.getElementById('movieReview').value = movie.userReview || '';

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('selected'));
    if (movie.userRating) {
        const rating = Math.round(movie.userRating);
        for (let i = 0; i < rating; i++) {
            stars[i].classList.add('selected');
        }
    }

    document.getElementById('editModal').style.display = 'block';
    setupStarRating();
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

function submitEdit() {
    const rating = parseFloat(document.getElementById('movieRating').value);
    const review = document.getElementById('movieReview').value.trim();

    if (!rating || rating < 1 || rating > 10) {
        alert('Please select a rating between 1 and 10.');
        return;
    }

    if (!currentEditMovie) return;

    let watched = getUserWatched();
    const index = watched.findIndex(m => m.id === currentEditMovie.id);
    if (index > -1) {
        watched[index] = {
            ...watched[index],
            userRating: rating,
            userReview: review,
            watchedDate: watched[index].watchedDate || new Date().toISOString()
        };
    }

    saveUserData(watched);
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('movieRating').value = '';
    document.getElementById('movieReview').value = '';
    document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
    currentEditMovie = null;
    displayWatched();
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function setupModalClose() {
    document.querySelector('.close').onclick = function() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('movieRating').value = '';
        document.getElementById('movieReview').value = '';
        document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
    };

    window.onclick = function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            modal.style.display = 'none';
            document.getElementById('movieRating').value = '';
            document.getElementById('movieReview').value = '';
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