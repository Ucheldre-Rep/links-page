const fs = require('fs');
const path = require('path');

class JsonCache {
    constructor() {
        this.cache = {};
        this.watchers = {};
    }

    load(filePath, defaultData = null) {
        const resolved = path.resolve(filePath);
        try {
            if (!fs.existsSync(resolved)) {
                // Create parent directory if needed
                const dir = path.dirname(resolved);
                if (!dir || !fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(resolved, JSON.stringify(defaultData, null, 2), 'utf-8');
                this.cache[resolved] = defaultData;
            } else {
                const raw = fs.readFileSync(resolved, 'utf-8');
                this.cache[resolved] = JSON.parse(raw);
            }
        } catch (err) {
            console.error(`[JsonCache] Error loading ${resolved}:`, err.message);
            this.cache[resolved] = defaultData;
        }

        // Watch for changes
        if (!this.watchers[resolved]) {
            try {
                let debounce = null;
                this.watchers[resolved] = fs.watch(resolved, () => {
                    clearTimeout(debounce);
                    debounce = setTimeout(() => {
                        try {
                            const raw = fs.readFileSync(resolved, 'utf-8');
                            this.cache[resolved] = JSON.parse(raw);
                            console.log(`[JsonCache] Reloaded ${path.basename(resolved)}`);
                        } catch (e) {
                            console.error(`[JsonCache] Error reloading ${resolved}:`, e.message);
                        }
                    }, 100);
                });
            } catch (e) {
                console.error(`[JsonCache] Could not watch ${resolved}:`, e.message);
            }
        }

        return this.cache[resolved];
    }

    get(filePath) {
        const resolved = path.resolve(filePath);
        return this.cache[resolved] || null;
    }

    save(filePath, data) {
        const resolved = path.resolve(filePath);
        this.cache[resolved] = data;
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(resolved, JSON.stringify(data, null, 2), 'utf-8');
    }
}

module.exports = new JsonCache();
