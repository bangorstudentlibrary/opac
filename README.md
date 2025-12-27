# Bangor Student Library - OPAC

This system provides an Online Public Access Catalog (OPAC) view of a collection stored in a Google Spreadsheet. It is designed to be hosted as a static site (HTML/CSS/JS only) to eliminate server-side vulnerabilities and maintenance costs.

## Data Flow

* Source: Google Sheets (Backend/Database).

* Transport: CSV via Google’s "Publish to Web" feature.

* Parsing: PapaParse converts CSV strings into JSON objects on page load.

* Rendering: JavaScript dynamically generates the HTML grid.

* Enrichment: Images are pulled via a specific URL pattern from the Open Library API using the ISBN key.


## Technical Requirements & Dependencies

* CORS: Google Sheets CSV export supports Cross-Origin Resource Sharing, allowing direct browser fetch requests.

* Libraries: * PapaParse.min.js (CDN): Required for fast, asynchronous CSV processing.

* API: * covers.openlibrary.org: Used for dynamic image injection. No API key required.

##  Configuration (The Code Level)

To point this front-end to a new database, the webmaster must update the following in index.html:

### The CSV Endpoint

    const publicCsvUrl = 'YOUR_URL_HERE'; 

* Must be the "Published to Web" URL, not the standard "Share" URL.

* Must be set to the "CSV" format output.

### Data Mapping

The script expects a 1:1 match between the Sheet headers and the JS object keys. If the headers in the Sheet change, the following references in the render function must be updated:

    book.Title

    book.Author

    book.ISBN

## Maintenance & Troubleshooting

### Latency/Sync Issues

Google caches the published CSV. There is a 5–10 minute delay between a user editing the Google Sheet and those changes appearing on the live site. This is a Google-side limitation and cannot be bypassed via the static front-end.
Image Fallbacks

The script uses a double-layer fallback for cover images:

    Validation: Checks if the ISBN field is populated.

    Error Handling: An onerror event listener is attached to every <img> tag. If the Open Library API returns a 404 or a broken image, the script triggers a CSS-based placeholder to prevent broken layout elements.

### ISBN Sanitization

The script uses a Regex /[^0-9X]/gi to strip non-alphanumeric characters. 

This ensures that ISBNs entered as 978-3-16-148410-0 are correctly processed as 9783161484100 for API compatibility.

## Security Considerations

* Read-Only: This interface is read-only. There is no risk of SQL injection or data tampering from the front-end.

* Data Exposure: Any data included in the "Published" Sheet is visible in the network tab to anyone visiting the site. Do not include private notes or borrower information in the published sheet.
