//config data
const API_URL = 'https://api.themoviedb.org/3'
const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNjIyMmViZjM2YTlkZmNmODQxOTEzOGFhMjhkMmE2NCIsInN1YiI6IjY0M2EzYjQ0MzEyMzQ1MDQ3MGQ4MjYzOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kh_jceg8Zio16Wju3_YwV-f3SviyhtGgGORx37pn3TU'
const IMAGES_BASE_URL = 'https://image.tmdb.org/t/p/w185'

//dom elements
const moviesList = document.querySelector('.movies-list')
const errorScreen = document.querySelector('.error-screen')
const emptyScreen = document.querySelector('.empty-screen')
const loadingScreen = document.querySelector('.loading-screen')
const searchForm = document.querySelector('.search-form')
const searchBtn = document.querySelector('.search-form button')

let movies = []
let filteredMovies = []

addEventListener('load', init)

function init() {
    searchForm.addEventListener('submit', searchMovies)
    loadMovies()
}

function loadMovies() {
    try {
        let savedMovies = JSON.parse(localStorage.getItem('movies') || '[]')
        
        if(savedMovies.length) {
            movies = savedMovies
            renderMovies(movies)
        }
        else {
            fetchLatestMovies()
        }
    } 
    catch (error) {
        console.error(error)
        fetchLatestMovies()
    }
}

async function fetchLatestMovies() {    
    try {
        const response = await api('movie/popular')
        if(!response.ok) return show(errorScreen, 'Unable to find latest movies')

        const json = await response.json()
        console.log('latest movies', json)

        const {results} = json
        if(!results.length) throw new Error('No movies found')

        saveNewMovies(results)
        renderMovies()
    } 
    catch (error) {
        console.error(error)
        show(emptyScreen, 'No movies in our record, come back later.')
    }
}

async function searchMovies(e) {
    e.preventDefault()

    searchBtn.disabled = true
    show(loadingScreen)
    
    try {
        const searchTerm = document.querySelector('.search-form input').value.trim()

        if(searchTerm.length) {
            filteredMovies = movies.filter(movie => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
            if(filteredMovies.length) return renderMovies(filteredMovies)
        }
        else {
            return renderMovies(movies)
        }

        const params = new URLSearchParams({
            language: 'en-US',
            query: searchTerm,
            include_adult: false,
            page: 1
        })

        const response = await api(`search/movie?${params.toString()}`)    
        if(!response.ok) return show(errorScreen, `Unable to find movies for '${searchTerm}' keyword`)

        const json = await response.json()
        console.log('search results', json)

        const {results} = json

        if(results.length) {
            saveNewMovies(results)
            renderMovies(results)
        }
        else {
            show(emptyScreen, `No movies found for '${searchTerm}' keyword`)
        }
    } 
    catch (error) {
        console.error(error)
        show(errorScreen, 'Error occurred while searching. Try again later after few moments.')
    }

    searchBtn.disabled = false
}

function saveNewMovies(moviesList) {
    let newMovies = moviesList.filter(movie => !movies.find(savedMovie => savedMovie.id === movie.id))

    if(newMovies.length) {
        movies = [...movies, ...newMovies]
        localStorage.setItem('movies', JSON.stringify(movies))

        console.log(`✅ ${newMovies.length} new movies saved`)
    }
    else {
        console.log('❌ No new movies found')
    }
}

function renderMovies(items) {
    moviesList.innerHTML = items.map(toMovieCard).join('\n')
    searchBtn.disabled = false

    show(moviesList)
}

function toMovieCard(movie) {
    return `<section class="movie-card">
        <img src="${IMAGES_BASE_URL}${movie.poster_path}" alt="${movie.title} Poster Image" class="movie-poster">
        <span class="movie-title">${movie.title}</span>
        <div class="movie-facts">
            <div class="fact-item">
                <span class="fact-label">Release Date:</span>
                <span class="fact-value">${movie.release_date}</span>
            </div>
            <button class="btn btn-sm btn-primary" data-movie-id="${movie.id}" onclick="showMovieDetails(this)">Read More</button>
        </div>
    </section>`
}

function show(screen, msg = '') {
    [moviesList, errorScreen, emptyScreen, loadingScreen].forEach(screenItem => {
        if(screenItem === screen) {
            screenItem.classList.remove('d-none')
        }
        else {
            screenItem.classList.add('d-none')
        }
    })

    if(!msg) return

    let msgEl = screen.querySelector('[class*="-msg"]')
    if(!msg) return

    msgEl.innerText = msg
}

function showMovieDetails(e) {
    let movieId = e.dataset.movieId

    let movie = movies.find(movie => movie.id == movieId)
    if(!movie) return console.error('No movie found for this id')

    const target = e.parentElement
    e.remove() //remove read more button

    target.insertAdjacentHTML(
        'beforeend', 
        `<div class="fact-item">
            <span class="fact-label">Vote Count:</span>
            <span class="fact-value">${movie.vote_count}</span>
        </div>`
    )
}

function api(resource) {
    const options = {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    }

    return fetch(`${API_URL}/${resource}`, options) 
}