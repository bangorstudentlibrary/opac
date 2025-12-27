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
        const coverUrl = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : ''
        return `
            <div class="book-card" onclick="showDetails('${isbn}')" style="cursor:pointer;">
                ... existing card HTML ...
            </div>
        `;

        
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

// Details page

async function showDetails(isbn) {
    const grid = document.getElementById('catalog-grid');
    const detailsView = document.getElementById('details-view');
    const detailsContent = document.getElementById('details-content');

    // Toggle visibility
    grid.style.display = 'none';
    detailsView.style.display = 'block';
    detailsContent.innerHTML = "Fetching description...";

    try {
        // Search Open Library by ISBN to get the "Work ID"
        const searchRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const searchData = await searchRes.json();
        const bookData = searchData[`ISBN:${isbn}`];

        if (bookData) {
            detailsContent.innerHTML = `
                <div class="details-layout">
                    <img src="${bookData.cover?.large || ''}" class="details-cover">
                    <div class="details-text">
                        <h2>${bookData.title}</h2>
                        <p><strong>Published:</strong> ${bookData.publish_date || 'N/A'}</p>
                        <p><strong>Pages:</strong> ${bookData.number_of_pages || 'N/A'}</p>
                        <hr>
                        <p>${bookData.notes || "No description available in Open Library."}</p>
                    </div>
                </div>
            `;
        } else {
            detailsContent.innerHTML = "Book details not found in Open Library database.";
        }
    } catch (err) {
        detailsContent.innerHTML = "Error loading details.";
    }
}

function showGrid() {
    document.getElementById('catalog-grid').style.display = 'grid';
    document.getElementById('details-view').style.display = 'none';
}
    
}
