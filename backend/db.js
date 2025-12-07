import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'heirloom_hub.db');

// Initialize SQL.js database
let db = null;
let SQL = null;

// Initialize the database
async function initDatabase() {
    if (!SQL) {
        SQL = await initSqlJs();
    }

    if (fs.existsSync(dbPath)) {
        // Load existing database
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log('✅ Loaded existing SQLite database from:', dbPath);
    } else {
        // Create new database
        db = new SQL.Database();
        console.log('✅ Created new SQLite database at:', dbPath);
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    return db;
}

// Save database to file
export function saveDatabase() {
    if (db) {
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
            console.log('💾 Database saved to disk');
        } catch (error) {
            console.error('❌ Error saving database:', error);
        }
    }
}

// Auto-save every 2 seconds (reduced from 5 for faster persistence)
setInterval(() => {
    saveDatabase();
}, 2000);

// Save on exit
process.on('exit', () => {
    console.log('Process exiting, saving database...');
    saveDatabase();
});

process.on('SIGINT', () => {
    console.log('SIGINT received, saving database...');
    saveDatabase();
    process.exit(0);
});

// Helper function to execute queries (compatible with PostgreSQL-style parameterized queries)
export const query = async (text, params = []) => {
    const start = Date.now();

    // Initialize database if not already done
    if (!db) {
        await initDatabase();
    }

    try {
        // Convert PostgreSQL-style $1, $2 placeholders to SQLite-style ? placeholders
        let sqliteQuery = text.replace(/\$(\d+)/g, '?');

        // Determine if it's a SELECT query or a mutation
        const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');
        const isInsert = sqliteQuery.trim().toUpperCase().startsWith('INSERT');
        const isUpdate = sqliteQuery.trim().toUpperCase().startsWith('UPDATE');
        const isDelete = sqliteQuery.trim().toUpperCase().startsWith('DELETE');

        let result;

        if (isSelect) {
            // Execute SELECT query
            const stmt = db.prepare(sqliteQuery);
            stmt.bind(params);

            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();

            result = { rows, rowCount: rows.length };
        } else if (isInsert && sqliteQuery.toUpperCase().includes('RETURNING')) {
            // Handle INSERT with RETURNING clause
            const queryWithoutReturning = sqliteQuery.replace(/RETURNING.*/i, '').trim();

            db.run(queryWithoutReturning, params);

            // Get the last inserted row
            const tableName = extractTableName(queryWithoutReturning);
            if (tableName) {
                const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
                const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                selectStmt.bind([lastId]);

                const row = selectStmt.step() ? selectStmt.getAsObject() : null;
                selectStmt.free();

                result = { rows: row ? [row] : [], rowCount: 1 };
            } else {
                result = { rows: [], rowCount: 1 };
            }

            saveDatabase();
        } else if (isUpdate && sqliteQuery.toUpperCase().includes('RETURNING')) {
            // Handle UPDATE with RETURNING clause
            const queryWithoutReturning = sqliteQuery.replace(/RETURNING.*/i, '').trim();

            db.run(queryWithoutReturning, params);

            // Extract WHERE clause to get the updated row
            const whereMatch = queryWithoutReturning.match(/WHERE\s+id\s*=\s*\?/i);
            if (whereMatch && params.length > 0) {
                const idParam = params[params.length - 1]; // Last param is usually the ID
                const tableName = extractTableName(queryWithoutReturning);

                if (tableName) {
                    const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                    selectStmt.bind([idParam]);

                    const row = selectStmt.step() ? selectStmt.getAsObject() : null;
                    selectStmt.free();

                    result = { rows: row ? [row] : [], rowCount: 1 };
                } else {
                    result = { rows: [], rowCount: 1 };
                }
            } else {
                result = { rows: [], rowCount: 1 };
            }

            saveDatabase();
        } else if (isDelete && sqliteQuery.toUpperCase().includes('RETURNING')) {
            // Handle DELETE with RETURNING clause
            // First get the row before deleting
            const whereMatch = sqliteQuery.match(/WHERE\s+(.+?)\s+RETURNING/i);
            if (whereMatch) {
                const tableName = extractTableName(sqliteQuery);
                const whereClause = whereMatch[1];

                const selectQuery = `SELECT * FROM ${tableName} WHERE ${whereClause}`;
                const selectStmt = db.prepare(selectQuery);
                selectStmt.bind(params);

                const row = selectStmt.step() ? selectStmt.getAsObject() : null;
                selectStmt.free();

                // Now delete
                const queryWithoutReturning = sqliteQuery.replace(/RETURNING.*/i, '').trim();
                db.run(queryWithoutReturning, params);

                result = { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
            } else {
                const queryWithoutReturning = sqliteQuery.replace(/RETURNING.*/i, '').trim();
                db.run(queryWithoutReturning, params);
                result = { rows: [], rowCount: 1 };
            }

            saveDatabase();
        } else {
            // Regular mutation (INSERT, UPDATE, DELETE without RETURNING)
            db.run(sqliteQuery, params);
            result = { rows: [], rowCount: db.getRowsModified() };
            saveDatabase(); // Immediate save after mutation
        }

        const duration = Date.now() - start;
        console.log('Executed query', { text: sqliteQuery.substring(0, 100), duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        console.error('Query:', text);
        console.error('Params:', params);
        throw error;
    }
};

// Helper function to extract table name from INSERT/UPDATE/DELETE query
function extractTableName(query) {
    const insertMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
    if (insertMatch) return insertMatch[1];

    const updateMatch = query.match(/UPDATE\s+(\w+)/i);
    if (updateMatch) return updateMatch[1];

    const deleteMatch = query.match(/DELETE\s+FROM\s+(\w+)/i);
    if (deleteMatch) return deleteMatch[1];

    return null;
}

// Helper function to get a client (for transaction support)
export const getClient = () => {
    return {
        query: query,
        release: () => { }, // No-op for sql.js
        query: async (text, params) => query(text, params)
    };
};

// Initialize database on module load
await initDatabase();

export default db;
