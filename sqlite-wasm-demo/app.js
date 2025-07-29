const { createApp } = Vue;

createApp({
    data() {
        return {
            // Database state
            db: null,
            SQL: null,
            isInitialized: false,
            csvUrl: './repositories.csv',
            
            // UI state
            statusMessage: '正在初始化 SQLite...',
            statusType: 'loading',
            isInitialized: false,
            isDataLoaded: false,
            isLoading: false,
            showResults: false,
            showSampleQueries: false,
            
            // Query state
            sqlQuery: '',
            queryResults: {
                columns: [],
                values: []
            },
            
            // Sample queries
            sampleQueries: [
                { 'display': '前十筆資料', 'query': 'SELECT * FROM repositories LIMIT 10;' },
                { 'display': '星星數 TOP 20', 'query': `SELECT name, stars, language FROM repositories ORDER BY stars DESC LIMIT 20;` },
                { 'display': '程式語言 TOP 10', 'query': `SELECT language, COUNT(*) as count FROM repositories
WHERE language <> '' GROUP BY language ORDER BY count DESC LIMIT 10;` },
                { 'display': '開源授權排行', 'query': `SELECT license, COUNT(*) as count FROM repositories
WHERE license <> '' GROUP BY license ORDER BY count DESC;` }
            ]
        };
    },
    
    mounted() {
        this.initialize();
    },
    
    methods: {
        async initialize() {
            try {
                this.setStatus('正在初始化 SQLite...', 'loading');
                this.isLoading = true;
                
                if (typeof initSqlJs === 'undefined') {
                    throw new Error('SQL.js library not loaded');
                }
                
                this.SQL = await initSqlJs({
                    locateFile: file => `libs/${file}`
                });

                this.db = new this.SQL.Database();
                this.isInitialized = true;
                this.isLoading = false;
                
                this.setStatus('SQLite WASM 初始化完成！', 'success');
                
            } catch (error) {
                console.error('Initialization error:', error);
                this.isLoading = false;
                this.setStatus('SQLite 初始化失敗: ' + error.message, 'error');
            }
        },

        async loadCsvFromUrl() {
            try {
                this.isLoading = true;
                this.setStatus('正在下載 CSV 檔案...', 'loading');
                
                const response = await fetch(this.csvUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const csvText = await response.text();
                
                this.setStatus('正在處理 CSV 資料...', 'loading');
                await this.processCsvData(csvText);
                
            } catch (error) {
                console.error('CSV loading error:', error);
                this.isLoading = false;
                this.setStatus('載入 CSV 失敗: ' + error.message, 'error');
            }
        },

        async processCsvData(csvText) {
            try {
                const startTime = performance.now();
                
                // Create table
                this.db.run('DROP TABLE IF EXISTS repositories');
                this.db.run(`
                    CREATE TABLE repositories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        description TEXT,
                        url TEXT,
                        created_at TEXT,
                        updated_at TEXT,
                        homepage TEXT,
                        size INTEGER,
                        stars INTEGER,
                        forks INTEGER,
                        issues INTEGER,
                        watchers INTEGER,
                        language TEXT,
                        license TEXT,
                        topics TEXT,
                        has_issues BOOLEAN,
                        has_projects BOOLEAN,
                        has_downloads BOOLEAN,
                        has_wiki BOOLEAN,
                        has_pages BOOLEAN,
                        has_discussions BOOLEAN,
                        is_fork BOOLEAN,
                        is_archived BOOLEAN,
                        is_template BOOLEAN,
                        default_branch TEXT
                    )
                `);

                const lines = csvText.split('\n');
                
                const stmt = this.db.prepare(`
                    INSERT INTO repositories (
                        name, description, url, created_at, updated_at, homepage,
                        size, stars, forks, issues, watchers, language, license,
                        topics, has_issues, has_projects, has_downloads, has_wiki,
                        has_pages, has_discussions, is_fork, is_archived, is_template,
                        default_branch
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                let processedCount = 0;
                this.db.run('BEGIN TRANSACTION');

                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;

                    try {
                        const values = this.parseCSVLine(lines[i]);
                        if (values.length >= 24) {
                            stmt.run([
                                values[0], values[1], values[2], values[3], values[4], values[5],
                                parseInt(values[6]) || 0, parseInt(values[7]) || 0, parseInt(values[8]) || 0,
                                parseInt(values[9]) || 0, parseInt(values[10]) || 0, values[11], values[12],
                                values[13], values[14] === 'True', values[15] === 'True', values[16] === 'True',
                                values[17] === 'True', values[18] === 'True', values[19] === 'True',
                                values[20] === 'True', values[21] === 'True', values[22] === 'True', values[23]
                            ]);
                            processedCount++;
                        }
                    } catch (error) {
                        console.warn('Error processing line', i, ':', error);
                    }
                }

                this.db.run('COMMIT');
                stmt.free();

                const endTime = performance.now();

                this.setStatus(`資料載入完成，共 ${processedCount.toLocaleString()} 筆 (${Math.round(endTime - startTime).toLocaleString()}ms)`, 'success');
                this.isDataLoaded = true;
                this.isLoading = false;

            } catch (error) {
                console.error('CSV processing error:', error);
                this.isLoading = false;
                this.setStatus('處理 CSV 失敗: ' + error.message, 'error');
            }
        },

        executeQuery() {
            const query = this.sqlQuery.trim();
            if (!query) {
                this.setStatus('請輸入 SQL 查詢語句', 'error');
                return;
            }

            try {
                this.setStatus('正在執行查詢...', 'loading');
                
                const results = this.db.exec(query);
                
                if (results.length === 0) {
                    this.queryResults = { columns: [], values: [] };
                    this.showResults = true;
                    this.setStatus('查詢執行成功 (無結果)', 'success');
                } else {
                    this.queryResults = results[0];
                    this.showResults = true;
                    this.setStatus(`查詢執行成功 (${results[0].values.length.toLocaleString()} 筆資料)`, 'success');
                }

            } catch (error) {
                console.error('Query error:', error);
                this.setStatus('查詢錯誤: ' + error.message, 'error');
            }
        },

        selectSampleQuery(query) {
            this.sqlQuery = query;
            this.showSampleQueries = false;
        },

        toggleSampleQueries() {
            this.showSampleQueries = !this.showSampleQueries;
        },

        clearResults() {
            this.showResults = false;
            this.queryResults = { columns: [], values: [] };
            this.sqlQuery = '';
        },

        setStatus(message, type) {
            this.statusMessage = message;
            this.statusType = type;
        },

        parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (!inQuotes && (char === '"' || char === "'")) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (inQuotes && char === quoteChar) {
                    if (nextChar === quoteChar) {
                        current += char;
                        i++;
                    } else {
                        inQuotes = false;
                        quoteChar = '';
                    }
                } else if (!inQuotes && char === ',') {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            values.push(current.trim());
            return values;
        }
    }
}).mount('#app');