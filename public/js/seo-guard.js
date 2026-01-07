/**
 * SEO Guard Script
 * Enforces strict canonicalization and noindex logic for search queries.
 */
(function () {
    const HOST = 'https://ilovpdf.in';
    const path = window.location.pathname === '/' ? '' : window.location.pathname.replace(/\/$/, ''); // No trailing slash except root

    // 1. Construct Clean Canonical URL
    const cleanUrl = HOST + path;

    // 2. Manage Canonical Tag
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }

    // Ensure strict canonical (no params, correct host)
    if (link.href !== cleanUrl) {
        link.href = cleanUrl;
    }

    // 3. Handle Search Parameters (?q=)
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) {
        // Add noindex meta tag
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'robots';
            document.head.appendChild(meta);
        }
        meta.content = 'noindex, follow';

        // Ensure canonical points to clean root/page (without query) behavior is already handled above by using 'cleanUrl' which ignores search
    }
})();
