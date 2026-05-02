const express = require('express');
const router  = express.Router();
const path    = require('path');
const crypto  = require('crypto');

const jsonCache = require('../utils/jsonCache');

const linksPath    = path.join(__dirname, '..', 'data', 'links.json');
const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');

// ── Auth middleware ──────────────────────────────────────────
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/admin/login');
}

// ── Login page ───────────────────────────────────────────────
router.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) return res.redirect('/admin');
    res.render('admin/login', {
        title: 'Admin Login',
        activePage: 'admin',
        error: null
    });
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin');
    }
    res.render('admin/login', {
        title: 'Admin Login',
        activePage: 'admin',
        error: 'Incorrect password. Please try again.'
    });
});

router.post('/logout', requireAuth, (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// ── Dashboard ────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
    const links = jsonCache.get(linksPath) || [];
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        activePage: 'admin',
        links: links
    });
});

// ── API: Check slug availability ─────────────────────────────
router.get('/api/links/check-slug', requireAuth, (req, res) => {
    const { slug, exclude } = req.query;
    if (!slug) return res.status(400).json({ error: 'Slug is required.' });

    const cleanSlug = slug.toLowerCase().replace(/^\/+/, '').replace(/[^a-z0-9\-\/]/g, '');
    const links = jsonCache.get(linksPath) || [];
    const taken = links.some(l => l.slug === cleanSlug && l.id !== exclude);
    res.json({ available: !taken, slug: cleanSlug });
});

// ── API: Create link ─────────────────────────────────────────
router.post('/api/links', requireAuth, (req, res) => {
    const links = jsonCache.get(linksPath) || [];
    const { slug, title, description, type, url, icon, enabled, showOnHomepage } = req.body;

    // Validate required fields
    if (!slug || !title || !url || !type) {
        return res.status(400).json({ error: 'Slug, title, URL, and type are required.' });
    }

    // Validate slug format
    const cleanSlug = slug.toLowerCase().replace(/^\/+/, '').replace(/[^a-z0-9\-\/]/g, '');
    if (!cleanSlug) {
        return res.status(400).json({ error: 'Invalid slug format.' });
    }

    // Check for duplicate slug
    if (links.some(l => l.slug === cleanSlug)) {
        return res.status(400).json({ error: 'A link with this slug already exists.' });
    }

    const newLink = {
        id: crypto.randomUUID(),
        slug: cleanSlug,
        title: title.trim(),
        description: (description || '').trim(),
        type,
        url: url.trim(),
        icon: (icon || 'fa-solid fa-link').trim(),
        enabled: enabled === 'true' || enabled === true,
        showOnHomepage: showOnHomepage === 'true' || showOnHomepage === true,
        clicks: 0,
        sortOrder: links.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    links.push(newLink);
    jsonCache.save(linksPath, links);
    res.json({ success: true, link: newLink });
});

// ── API: Update link ─────────────────────────────────────────
router.put('/api/links/:id', requireAuth, (req, res) => {
    const links = jsonCache.get(linksPath) || [];
    const index = links.findIndex(l => l.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Link not found.' });
    }

    const { slug, title, description, type, url, icon, enabled, showOnHomepage } = req.body;

    if (slug !== undefined) {
        const cleanSlug = slug.toLowerCase().replace(/^\/+/, '').replace(/[^a-z0-9\-\/]/g, '');
        if (!cleanSlug) return res.status(400).json({ error: 'Invalid slug format.' });
        // Check duplicate (excluding self)
        if (links.some(l => l.slug === cleanSlug && l.id !== req.params.id)) {
            return res.status(400).json({ error: 'A link with this slug already exists.' });
        }
        links[index].slug = cleanSlug;
    }

    if (title !== undefined)         links[index].title = title.trim();
    if (description !== undefined)   links[index].description = description.trim();
    if (type !== undefined)          links[index].type = type;
    if (url !== undefined)           links[index].url = url.trim();
    if (icon !== undefined)          links[index].icon = icon.trim();
    if (enabled !== undefined)       links[index].enabled = enabled === 'true' || enabled === true;
    if (showOnHomepage !== undefined) links[index].showOnHomepage = showOnHomepage === 'true' || showOnHomepage === true;

    links[index].updatedAt = new Date().toISOString();
    jsonCache.save(linksPath, links);
    res.json({ success: true, link: links[index] });
});

// ── API: Delete link ─────────────────────────────────────────
router.delete('/api/links/:id', requireAuth, (req, res) => {
    let links = jsonCache.get(linksPath) || [];
    const index = links.findIndex(l => l.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Link not found.' });
    }

    links.splice(index, 1);
    jsonCache.save(linksPath, links);
    res.json({ success: true });
});

// ── API: Reorder links ──────────────────────────────────────
router.put('/api/links-reorder', requireAuth, (req, res) => {
    const { order } = req.body; // array of IDs in desired order
    if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Order must be an array of link IDs.' });
    }

    let links = jsonCache.get(linksPath) || [];
    const reordered = [];
    order.forEach((id, i) => {
        const link = links.find(l => l.id === id);
        if (link) {
            link.sortOrder = i;
            reordered.push(link);
        }
    });
    // Append any links not in the order array
    links.forEach(l => {
        if (!reordered.find(r => r.id === l.id)) {
            l.sortOrder = reordered.length;
            reordered.push(l);
        }
    });

    jsonCache.save(linksPath, reordered);
    res.json({ success: true });
});

// ── API: Toggle link enabled ─────────────────────────────────
router.patch('/api/links/:id/toggle', requireAuth, (req, res) => {
    const links = jsonCache.get(linksPath) || [];
    const link = links.find(l => l.id === req.params.id);

    if (!link) {
        return res.status(404).json({ error: 'Link not found.' });
    }

    link.enabled = !link.enabled;
    link.updatedAt = new Date().toISOString();
    jsonCache.save(linksPath, links);
    res.json({ success: true, enabled: link.enabled });
});

// ── API: Update settings ─────────────────────────────────────
router.put('/api/settings', requireAuth, (req, res) => {
    const { siteName, siteDescription, brandColour } = req.body;
    const settings = jsonCache.get(settingsPath) || {};

    if (siteName !== undefined)        settings.siteName = siteName.trim();
    if (siteDescription !== undefined) settings.siteDescription = siteDescription.trim();
    if (brandColour !== undefined)     settings.brandColour = brandColour.trim();

    jsonCache.save(settingsPath, settings);
    res.json({ success: true, settings });
});

module.exports = router;
