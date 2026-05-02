require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const jsonCache = require('./utils/jsonCache');

const app = express();
const PORT = process.env.PORT || 40001;

// ── View engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'ucheldrerep-links-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// ── Load data ────────────────────────────────────────────────
jsonCache.load(path.join(__dirname, 'data', 'settings.json'), {
    siteName: 'Ucheldrerep Links',
    siteDescription: 'Quick links and redirects for Ucheldrerep',
    brandColour: '#6f42c1'
});

jsonCache.load(path.join(__dirname, 'data', 'links.json'), []);

// ── Locals (available to all views) ─────────────────────────
app.use((req, res, next) => {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    res.locals.settings = jsonCache.get(settingsPath);
    res.locals.isAdmin = req.session && req.session.isAdmin;
    next();
});

// ── Routes ───────────────────────────────────────────────────
const adminRoutes = require('./routes/admin');
const linkRoutes  = require('./routes/links');

app.use('/admin', adminRoutes);

// Homepage
app.get('/', (req, res) => {
    const linksPath = path.join(__dirname, 'data', 'links.json');
    const allLinks = jsonCache.get(linksPath);
    const enabledLinks = allLinks
        .filter(l => l.enabled && l.showOnHomepage !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.render('home', {
        title: 'Links',
        activePage: 'home',
        links: enabledLinks
    });
});

// Link catch-all (must be last)
app.use('/', linkRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        activePage: ''
    });
});

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('404', {
        title: 'Server Error',
        activePage: ''
    });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`UcheldreRepLinks running on http://localhost:${PORT}`);
});
