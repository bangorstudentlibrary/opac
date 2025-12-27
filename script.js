const publicCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdMNWKRk_G0Y4z8vGSKOimSXx1bIwvF1CC23QAdf-yD-IbVRUEAx3LAG6wcKJTqBizaiLjFa_NYOjR/pub?output=csv';
let libraryData = [];

// 1. INITIAL FETCH: Get the Google Sheet Data
Papa.parse(publicCsvUrl, {
    download: true,
    header: true,
    complete: function(results) {
        // Clean data: Filter out rows without a Title
        libraryData = results.data.filter(row => row.Title && row.Title.trim() !== "");
        renderGrid(libraryData);
    },
    error: function(err) {
        console.error("Error fetching sheet:", err);
        document.getElementById('catalog-grid').innerHTML = "Failed to load database.";
    }
});

// 2. RENDER GRID: Build the "Bookshelf"
function renderGrid(data) {
    const grid = document.getElementById('catalog-grid');
    const searchContainer = document.querySelector('.search-container');
    
    // Ensure search bar and grid are visible
    grid.style.display = 'grid';
    searchContainer.style.display = 'block';
    document.getElementById('details-view').style.display = 'none';

    if (data.length === 0) {
        grid.innerHTML = '<p class="loading">No books match your search.</p>';
        return;
    }

    grid.innerHTML = data.map(book => {
        const isbn = book.ISBN ? book.ISBN.replace(/[^0-9X]/gi, '') : '';
        const coverUrl = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : '';

        return `
            <div class="book-card" onclick="showDetails('${isbn}', '${encodeURIComponent(book.Title)}')">
                <div class="cover-wrapper">
                    ${isbn ? 
                        `<img src="${coverUrl}" class="cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` : 
                        ''
                    }
                    <div class="no-cover" style="${isbn ? 'display:none;' : ''}">No Cover</div>
                </div>
                <div class="title">${book.Title}</div>
                <div class="author">${book.Author || 'Unknown'}</div>
            </div>
        `;
    }).join('');
}

// 3. SEARCH LOGIC: Real-time filtering
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

// 4. DETAILS VIEW: Fetch additional info from Open Library API
async function showDetails(isbn, encodedTitle) {
    const grid = document.getElementById('catalog-grid');
    const searchContainer = document.querySelector('.search-container');
    const detailsView = document.getElementById('details-view');
    const detailsContent = document.getElementById('details-content');
    const title = decodeURIComponent(encodedTitle);

    // Hide catalog, show details page
    grid.style.display = 'none';
    searchContainer.style.display = 'none';
    detailsView.style.display = 'block';
    
    detailsContent.innerHTML = `<div class="loading">Connecting to Open Library for "${title}"...</div>`;

    if (!isbn) {
        detailsContent.innerHTML = `<h2>${title}</h2><p>No ISBN provided to fetch additional details.</p>`;
        return;
    }

    try {
        // Fetch detailed book data from Open Library
        // jscmd=details gives us the most comprehensive description/excerpt info
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`);
        const data = await response.json();
        const book = data[`ISBN:${isbn}`];

        if (book) {
            // Check for description (sometimes nested in .description or .description.value)
            let description = "No description available in the Open Library database.";
            const details = book.details;

            if (details.description) {
                description = typeof details.description === 'object' ? details.description.value : details.description;
            } else if (details.notes) {
                description = details.notes;
            }

            detailsContent.innerHTML = `
                <div class="details-layout">
                    <div class="details-cover-column">
                        <img src="https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg" class="large-cover" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                    </div>
                    <div class="details-text-column">
                        <h1>${book.thumbnail_url ? `<img src="${book.thumbnail_url}" style="height:30px; vertical-align:middle;"> ` : ''}${title}</h1>
                        <p class="details-meta"><strong>ISBN:</strong> ${isbn}</p>
                        ${details.publish_date ? `<p class="details-meta"><strong>Published:</strong> ${details.publish_date}</p>` : ''}
                        ${details.publisher ? `<p class="details-meta"><strong>Publisher:</strong> ${details.publisher[0]}</p>` : ''}
                        <hr>
                        <div class="description-text">${description}</div>
                    </div>
                </div>
            `;
        } else {
            detailsContent.innerHTML = `<h2>${title}</h2><p>Could not find extended details for ISBN: ${isbn}.</p>`;
        }
    } catch (error) {
        console.error("API Error:", error);
        detailsContent.innerHTML = `<h2>${title}</h2><p>Error retrieving data from Open Library.</p>`;
    }
}

// 5. NAVIGATION: Back to list
function showGrid() {
    renderGrid(libraryData);
    // Clear search if desired, or keep it to maintain user state
}
