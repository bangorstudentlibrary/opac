const publicCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdMNWKRk_G0Y4z8vGSKOimSXx1bIwvF1CC23QAdf-yD-IbVRUEAx3LAG6wcKJTqBizaiLjFa_NYOjR/pub?output=csv';
let libraryData = [];

// Fetch and Parse the Google Sheet
Papa.parse(publicCsvUrl, {
    download: true,
    header: true,
    complete: function(results) {
        // Filter out any rows that don't have a title
        libraryData = results.data.filter(row => row.Title && row.Title.trim() !== "");
        renderGrid(libraryData);
    },
    error: function(err) {
        console.error("Error fetching sheet:", err);
        document.getElementById('catalog-grid').innerHTML = "Failed to load catalog.";
    }
});

// Function to render the UI grid
function renderGrid(data) {
    const grid = document.getElementById('catalog-grid');
    
    if (data.length === 0) {
        grid.innerHTML = '<p class="loading">No books found matching your search.</p>';
        return;
    }

    grid.innerHTML = data.map(book => {
        // Sanitize ISBN for Open Library API
        const isbn = book.ISBN ? book.ISBN.replace(/[^0-9X]/gi, '') : '';
        const coverUrl = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : '';

        return `
            <div class="book-card">
                <div class="cover-wrapper">
                    ${isbn ? 
                        `<img src="${coverUrl}" class="cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` : 
                        ''
                    }
                    <div class="no-cover" style="${isbn ? 'display:none;' : ''} padding: 20px; text-align:center; font-size: 0.75rem; color: #bdc3c7;">
                        No Cover Available
                    </div>
                </div>
                <div class="title">${book.Title}</div>
                <div class="author">${book.Author || 'Unknown Author'}</div>
            </div>
        `;
    }).join('');
}

// Search function called on every keyup
function searchCatalog() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    
    const filtered = libraryData.filter(book => {
        return (
            book.Title?.toLowerCase().includes(query) ||
            book.Author?.toLowerCase().includes(query) ||
            book.ISBN?.toLowerCase().includes(query)
        );
    });

    renderGrid(filtered);
}
