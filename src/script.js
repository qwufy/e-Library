const axios = require('axios');

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const booksList = document.getElementById('booksList');

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const searchQuery = searchInput.value;

        try {
            const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
                params: {
                    q: searchQuery,
                    key: 'AIzaSyCGAbTdLgR_N0EF95SOYpbJh8w5_AQpEf0',
                    maxResults: 15,
                },
            });

            const books = response.data.items;

            // Очищаем предыдущие результаты поиска
            booksList.innerHTML = '';

            // Рендерим найденные книги
            books.forEach((book) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <img src="${book.volumeInfo.imageLinks.thumbnail}" alt="${book.volumeInfo.title}">
                    <h3>${book.volumeInfo.title}</h3>
                    <p>${book.volumeInfo.authors}</p>
                `;
                booksList.appendChild(listItem);
            });
        } catch (error) {
            console.error(error);
            alert('Failed to fetch search results. Please try again.');
        }
    });

    // Очистка результатов при фокусе на поле ввода
    searchInput.addEventListener('focus', () => {
        booksList.innerHTML = '';
    });
});

// Ваш существующий код
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const booksList = document.getElementById('booksList');

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const searchQuery = searchInput.value;

        try {
            const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
                params: {
                    q: searchQuery,
                    key: 'YOUR_API_KEY', // Замените на ваш ключ API
                    maxResults: 15,
                },
            });

            const books = response.data.items;

            // Очищаем предыдущие результаты поиска
            booksList.innerHTML = '';

            // Рендерим найденные книги
            books.forEach((book) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <img src="${book.volumeInfo.imageLinks.thumbnail}" alt="${book.volumeInfo.title}">
                    <h3>${book.volumeInfo.title}</h3>
                    <p>${book.volumeInfo.authors}</p>
                `;
                booksList.appendChild(listItem);
            });
        } catch (error) {
            console.error(error);
            alert('Failed to fetch search results. Please try again.');
        }
    });

    // Очистка результатов при фокусе на поле ввода
    searchInput.addEventListener('focus', () => {
        booksList.innerHTML = '';
    });
});

// Ваш существующий код
function searchBooks() {
    const query = document.getElementById('searchInput').value;
    search(query);
}

// Добавьте новые функции search и updateUIWithBooks
function search(query) {
    axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
            q: query,
            key: 'YOUR_API_KEY', // Замените на ваш ключ API
        },
    })
        .then(response => {
            const books = response.data.items;
            updateUIWithBooks(books);
        })
        .catch(error => {
            console.error('Failed to fetch search results. Please try again.');
        });
}

function updateUIWithBooks(books) {
    const booksList = document.getElementById('booksList');

    // Очищаем текущий список книг
    booksList.innerHTML = '';

    // Добавляем новые книги в список
    books.forEach(book => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${book.volumeInfo.imageLinks.thumbnail}" alt="${book.volumeInfo.title}">
            <h3>${book.volumeInfo.title}</h3>
            <p>${book.volumeInfo.authors}</p>
            <!-- Другие данные книги -->
        `;
        booksList.appendChild(li);
    });
}
