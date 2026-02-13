const { Client } = require('pg');

const client = new Client({
    host: '193.203.183.47',
    port: 5433,
    user: 'postgres',
    password: 'sszprohcpKdGdhMA4OfGcURJE',
    database: 'concordia',
});

async function run() {
    await client.connect();

    console.log('Connected to DB');

    // Check if schema 'main' exists
    const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'main'");
    if (schemaRes.rowCount === 0) {
        console.log("Schema 'main' does NOT exist.");
    } else {
        console.log("Schema 'main' exists.");

        // List tables in 'main'
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'");
        if (tablesRes.rowCount === 0) {
            console.log("Schema 'main' has NO tables.");
        } else {
            console.log("Schema 'main' tables:", tablesRes.rows.map(r => r.table_name));
        }
    }

    // Check 'schemas' table content
    try {
        const schemasTableRes = await client.query("SELECT * FROM public.schemas");
        console.log("'schemas' table content:", schemasTableRes.rows);
    } catch (e) {
        console.log("Error querying 'schemas' table:", e.message);
    }

    await client.end();
}

run().catch(e => console.error(e));
