(() => {
  const movies = Array.isArray(window.MOVIES) ? window.MOVIES : [];
  const grid = document.querySelector('#movieGrid');
  const searchInput = document.querySelector('#searchInput');
  const searchForm = document.querySelector('#searchForm');
  const catalogSummary = document.querySelector('#catalogSummary');
  const emptyState = document.querySelector('#emptyState');
  const apiSearchPanel = document.querySelector('#apiSearchPanel');
  const apiSearchTitle = document.querySelector('#apiSearchTitle');
  const apiSearchStatus = document.querySelector('#apiSearchStatus');
  const apiSearchResults = document.querySelector('#apiSearchResults');
  const movieTitleInput = document.querySelector('#movieTitleInput');
  const movieTitleSuggestions = document.querySelector('#movieTitleSuggestions');
  const recommendForm = document.querySelector('#recommendForm');
  const recommendationResults = document.querySelector('#recommendationResults');
  const watchlistCount = document.querySelector('#watchlistCount');
  const watchlistFilter = document.querySelector('#watchlistFilter');
  const watchlistToggle = document.querySelector('#watchlistToggle');
  const dialog = document.querySelector('#movieDialog');
  const toast = document.querySelector('#toast');

  const palette = [
    ['#75443d', '#30232d'], ['#3a5263', '#1b2638'], ['#71603d', '#2b2930'],
    ['#3e665f', '#202c36'], ['#7b5945', '#322531'], ['#554b73', '#242337'],
    ['#8b573d', '#322530'], ['#3b6972', '#1b303b'], ['#705147', '#2b2530'],
    ['#625f3f', '#252a2e'], ['#573e59', '#252333'], ['#7b6749', '#302934']
  ];
  const posterPhotos = [
    'photo-1462331940025-496dfbfc7564',
    'photo-1518837695005-2083093ee35b',
    'photo-1448375240586-882707db888b',
    'photo-1464822759023-fed622ff2c3b',
    'photo-1519608487953-e999c86e7455',
    'photo-1518709268805-4e9042af9f23',
    'photo-1470770841072-f978cf4d019e',
    'photo-1500530855697-b586d89ba3ee',
    'photo-1500534623283-312aade485b7',
    'photo-1470252649378-9c29740c9fa8',
    'photo-1485470733090-0aae1788d5af',
    'photo-1500534314209-a25ddb2bd429'
  ];
  const movieIndex = new Map(movies.map((movie, index) => [movie.title, index]));
  let watchlist = readWatchlist();
  let showWatchlistOnly = false;
  let activeMovie = null;
  let toastTimer;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function posterStyle(index, width = 650) {
    const [first, second] = palette[index % palette.length];
    const photo = posterPhotos[index % posterPhotos.length];
    const image = `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=82`;
    return `background-color:${second};background-image:linear-gradient(180deg,rgba(7,7,9,.08),rgba(7,7,9,.1) 35%,rgba(7,7,9,.56) 100%),url('${image}');background-position:center,center;background-size:cover,cover;`;
  }

  function readWatchlist() {
    try {
      const stored = JSON.parse(localStorage.getItem('reelgood-watchlist') || '[]');
      return Array.isArray(stored) ? stored.filter((title) => typeof title === 'string') : [];
    } catch (error) {
      announce('Your saved watchlist could not be loaded from this browser.');
      return [];
    }
  }

  function saveWatchlist() {
    try {
      localStorage.setItem('reelgood-watchlist', JSON.stringify(watchlist));
    } catch (error) {
      announce('Your browser could not save the watchlist. You can still use it for this visit.');
    }
  }

  function announce(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function updateWatchlistCount() {
    watchlistCount.textContent = String(watchlist.length);
  }

  function getMovieCard(movie, index) {
    const saved = watchlist.includes(movie.title);
    const title = escapeHTML(movie.title);
    const synopsis = escapeHTML(movie.description);
    return `
      <article class="movie-card" data-movie-index="${index}" tabindex="0" aria-label="View ${title}">
        <div class="poster" style="${posterStyle(index)}">
          <span class="poster-index">${String(index + 1).padStart(2, '0')}</span>
          <button class="save-button${saved ? ' is-saved' : ''}" type="button" data-save="${index}" aria-label="${saved ? 'Remove' : 'Add'} ${title} ${saved ? 'from' : 'to'} watchlist" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button>
          <span class="poster-title">${title}</span>
        </div>
        <div class="movie-meta"><h3>${title}</h3><span>STORY PICK</span></div>
        <p class="movie-snippet">${synopsis}</p>
      </article>`;
  }

  function renderMovies() {
    const visibleMovies = movies
      .map((movie, index) => ({ movie, index }))
      .filter(({ movie }) => !showWatchlistOnly || watchlist.includes(movie.title));
    grid.innerHTML = visibleMovies.map(({ movie, index }) => getMovieCard(movie, index)).join('');
    catalogSummary.textContent = `${visibleMovies.length} ${visibleMovies.length === 1 ? 'film' : 'films'} to explore`;
    emptyState.hidden = visibleMovies.length !== 0;
    updateWatchlistCount();
  }

  function fillMovieTitleSuggestions() {
    movieTitleSuggestions.insertAdjacentHTML('beforeend', movies.map((movie) =>
      `<option value="${escapeHTML(movie.title)}">${escapeHTML(movie.title)}</option>`).join(''));
  }

  function unwrapMatches(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      for (const key of ['matches', 'results', 'data']) {
        if (Array.isArray(payload[key])) return payload[key];
      }
      return [payload];
    }
    return [];
  }

  function firstValue(source, keys) {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
    }
    return '';
  }

  function hashSeed(value) {
    return Array.from(String(value || '')).reduce((total, character) => total + character.charCodeAt(0), 0);
  }

  function getMoviePosterStyle(title, index, width = 460, overrideImage = '') {
    if (typeof overrideImage === 'string' && overrideImage.trim()) {
      const image = overrideImage.trim();
      return `background-color:#201d22;background-image:linear-gradient(180deg,rgba(7,7,9,.08),rgba(7,7,9,.18) 32%,rgba(7,7,9,.62) 100%),url("${image}");background-position:center;background-size:cover;`;
    }
    const seed = hashSeed(title) + index;
    const [, second] = palette[seed % palette.length];
    const photo = posterPhotos[(seed + 1) % posterPhotos.length];
    const fallbackImage = `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=82`;
    return `background-color:${second};background-image:linear-gradient(180deg,rgba(7,7,9,.08),rgba(7,7,9,.1) 35%,rgba(7,7,9,.56) 100%),url('${fallbackImage}');background-position:center,center;background-size:cover,cover;`;
  }

  function normalizeMatch(item, index) {
    if (typeof item === 'string') return { title: item, description: '', score: '', image: '' };
    const outer = item && typeof item === 'object' ? item : {};
    const details = outer.movie || outer.movieDetails || outer.result || outer;
    let title = firstValue(details, ['title', 'movieTitle', 'movieName', 'name']);
    let description = firstValue(details, ['description', 'overview', 'plot', 'synopsis', 'summary']);
    if (String(title).length > 40 && String(description).length > 0 && String(description).length < 80) {
      [title, description] = [description, title];
    }
    const score = firstValue(outer, ['similarityScore', 'matchScore', 'similarity', 'score']);
    const image = firstValue(details, ['poster', 'posterUrl', 'image', 'imageUrl', 'photo', 'photoUrl', 'cover', 'coverImage']) || firstValue(outer, ['poster', 'posterUrl', 'image', 'imageUrl', 'photo', 'photoUrl', 'cover', 'coverImage']);
    const fallback = JSON.stringify(item);
    return {
      title: String(title || `Movie result ${index + 1}`),
      description: String(description || (fallback === '{}' ? '' : fallback)),
      score,
      image: typeof image === 'string' ? image.trim() : ''
    };
  }

  function formatScore(score) {
    if (score === '') return '';
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) return '';
    const percentage = numeric >= 0 && numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
    return `${Math.max(0, Math.min(100, percentage))}% MATCH`;
  }

  function renderMatchCards(payload, resultType = 'search') {
    const matches = unwrapMatches(payload).map(normalizeMatch);
    if (matches.length === 0) return '<p class="section-subtitle">No matching movies were found.</p>';
    return matches.map((match, index) => `
      <article class="api-result-card">
        <div class="api-result-poster" style="${getMoviePosterStyle(match.title, index, 420, match.image)}" aria-hidden="true"></div>
        <div class="api-result-copy">
          <div class="api-result-title">
            <span class="api-result-kind">${resultType === 'similarity' ? (index === 0 ? 'TITLE MATCH' : 'SIMILAR PICK') : 'DESCRIPTION MATCH'}</span>
            <h4>${escapeHTML(match.title)}</h4>
          </div>
          <p>${escapeHTML(match.description)}</p>
        </div>
        ${match.score === '' ? '' : `<span class="api-result-score">${escapeHTML(formatScore(match.score))}</span>`}
      </article>`).join('');
  }

  function findLocalMatches(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return movies.filter((movie) => `${movie.title} ${movie.description}`.toLowerCase().includes(normalizedQuery));
  }

  function findLocalRecommendations(title) {
    const normalizedTitle = title.trim().toLowerCase();
    if (!normalizedTitle) return [];
    const exact = movies.filter((movie) => movie.title.toLowerCase() === normalizedTitle);
    const related = movies.filter((movie) => {
      if (movie.title.toLowerCase() === normalizedTitle) return false;
      const searchText = `${movie.title} ${movie.description}`.toLowerCase();
      return searchText.includes(normalizedTitle) || normalizedTitle.includes(movie.title.toLowerCase());
    });
    return [...exact, ...related].slice(0, 4);
  }

  async function requestMovies(endpoint, query) {
    const baseUrl = String(window.MOVIE_API_BASE_URL || '').replace(/\/+$/, '');
    const encodedQuery = new URLSearchParams({ query }).toString();
    const response = await fetch(`${baseUrl}/movies/${endpoint}?${encodedQuery}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`The movie service returned ${response.status} ${response.statusText}.`);
    }
    return response.json();
  }

  async function searchMovies(query) {
    apiSearchPanel.hidden = false;
    apiSearchTitle.textContent = `Search results for “${query}”`;
    apiSearchStatus.textContent = 'Searching the movie service...';
    apiSearchResults.innerHTML = '';
    try {
      const results = await requestMovies('search', query);
      apiSearchResults.innerHTML = renderMatchCards(results);
      apiSearchStatus.textContent = `${unwrapMatches(results).length} results from /movies/search`;
    } catch (error) {
      const localMatches = findLocalMatches(query);
      if (localMatches.length > 0) {
        apiSearchResults.innerHTML = renderMatchCards(localMatches.map((movie) => ({
          title: movie.title,
          description: movie.description,
          score: '',
          image: ''
        })));
        apiSearchStatus.textContent = `${localMatches.length} local matches found for “${query}”`;
        return;
      }
      apiSearchStatus.textContent = 'Could not reach the movie service.';
      apiSearchResults.innerHTML = `<p class="api-result-error">${escapeHTML(error.message)} Check the API URL and make sure the backend is running.</p>`;
    }
  }

  async function recommendMovies(movieTitle) {
    recommendationResults.innerHTML = '<p class="section-subtitle">Finding similar movies...</p>';
    try {
      const results = await requestMovies('title/similarity', movieTitle);
      recommendationResults.innerHTML = `
        <div class="result-heading">
          <h3>Movie and similar picks for “${escapeHTML(movieTitle)}”</h3>
          <p>${unwrapMatches(results).length} results from /movies/title/similarity</p>
        </div>
        <div class="api-result-list">${renderMatchCards(results, 'similarity')}</div>`;
    } catch (error) {
      const localMatches = findLocalRecommendations(movieTitle);
      if (localMatches.length > 0) {
        recommendationResults.innerHTML = `
          <div class="result-heading">
            <h3>Movie and similar picks for “${escapeHTML(movieTitle)}”</h3>
            <p>${localMatches.length} local recommendations</p>
          </div>
          <div class="api-result-list">${renderMatchCards(localMatches.map((movie) => ({
            title: movie.title,
            description: movie.description,
            score: '',
            image: ''
          })), 'similarity')}</div>`;
        return;
      }
      recommendationResults.innerHTML = `<p class="api-result-error">${escapeHTML(error.message)} Check the API URL and make sure the backend is running.</p>`;
    }
  }

  function toggleSave(movie) {
    if (watchlist.includes(movie.title)) {
      watchlist = watchlist.filter((title) => title !== movie.title);
      announce(`${movie.title} removed from your watchlist.`);
    } else {
      watchlist = [...watchlist, movie.title];
      announce(`${movie.title} added to your watchlist.`);
    }
    saveWatchlist();
    renderMovies();
    if (activeMovie?.title === movie.title) updateDialogSaveButton();
  }

  function updateDialogSaveButton() {
    const saved = watchlist.includes(activeMovie.title);
    document.querySelector('#dialogSave').innerHTML = `<span aria-hidden="true">${saved ? '♥' : '♡'}</span> ${saved ? 'Saved to watchlist' : 'Save to watchlist'}`;
  }

  function openMovie(movie) {
    activeMovie = movie;
    const index = movieIndex.get(movie.title);
    document.querySelector('#dialogTitle').textContent = movie.title;
    document.querySelector('#dialogDescription').textContent = movie.description;
    const dialogPoster = document.querySelector('#dialogPoster');
    dialogPoster.style = posterStyle(index, 1200);
    updateDialogSaveButton();
    dialog.showModal();
  }

  grid.addEventListener('click', (event) => {
    const saveButton = event.target.closest('[data-save]');
    if (saveButton) {
      event.stopPropagation();
      toggleSave(movies[Number(saveButton.dataset.save)]);
      return;
    }
    const card = event.target.closest('[data-movie-index]');
    if (card) openMovie(movies[Number(card.dataset.movieIndex)]);
  });

  grid.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.movie-card')) {
      event.preventDefault();
      openMovie(movies[Number(event.target.dataset.movieIndex)]);
    }
  });

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) searchMovies(query);
  });
  watchlistFilter.addEventListener('click', () => {
    showWatchlistOnly = !showWatchlistOnly;
    watchlistFilter.setAttribute('aria-pressed', String(showWatchlistOnly));
    renderMovies();
  });
  watchlistToggle.addEventListener('click', () => {
    showWatchlistOnly = true;
    watchlistFilter.setAttribute('aria-pressed', 'true');
    renderMovies();
    document.querySelector('#discover').scrollIntoView({ behavior: 'smooth' });
  });
  recommendForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = movieTitleInput.value.trim();
    if (title) recommendMovies(title);
  });
  document.querySelector('#heroMovieButton').addEventListener('click', () => {
    const featured = movies.find((movie) => movie.title === 'Interstellar');
    if (featured) openMovie(featured);
  });
  document.querySelector('#dialogClose').addEventListener('click', () => dialog.close());
  document.querySelector('#dialogSave').addEventListener('click', () => {
    if (activeMovie) toggleSave(activeMovie);
  });
  document.querySelector('#dialogRecommend').addEventListener('click', () => {
    if (!activeMovie) return;
    movieTitleInput.value = activeMovie.title;
    recommendMovies(activeMovie.title);
    dialog.close();
    document.querySelector('#recommend').scrollIntoView({ behavior: 'smooth' });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
      document.querySelector('#discover').scrollIntoView({ behavior: 'smooth' });
    }
  });

  fillMovieTitleSuggestions();
  renderMovies();
  if (movies.length === 0) {
    announce('The movie list did not load. Make sure movies-data.js is next to index.html.');
  }
})();
