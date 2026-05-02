const express = require('express');
const router  = express.Router();
const path    = require('path');

const jsonCache = require('../utils/jsonCache');
const linksPath = path.join(__dirname, '..', 'data', 'links.json');

// ── Catch-all slug handler ──────────────────────────────────
router.get('/:slug(*)', (req, res, next) => {
    const slug = req.params.slug.toLowerCase().replace(/^\/+|\/+$/g, '');
    const links = jsonCache.get(linksPath) || [];
    const link = links.find(l => l.slug === slug && l.enabled);

    if (!link) return next(); // Fall through to 404

    // Track click
    link.clicks = (link.clicks || 0) + 1;
    jsonCache.save(linksPath, links);

    switch (link.type) {
        case 'redirect':
            return res.redirect(302, link.url);

        case 'permanent-redirect':
            return res.redirect(301, link.url);

        case 'embed':
            return res.render('link-embed', {
                title: link.title,
                activePage: '',
                link
            });

        case 'info':
        default:
            return res.render('link-info', {
                title: link.title,
                activePage: '',
                link
            });
    }
});

module.exports = router;
