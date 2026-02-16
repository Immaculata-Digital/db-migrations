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

    try {
        // Get all non-system schemas from PG
        const pgSchemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')");
        const pgSchemas = pgSchemasRes.rows.map(r => r.schema_name);

        console.log("Found schemas in PG:", pgSchemas);

        for (const schema of pgSchemas) {
            await client.query("INSERT INTO public.schemas (schema_name) VALUES ($1) ON CONFLICT (schema_name) DO NOTHING", [schema]);
            console.log(`Registered '${schema}' in 'schemas' table.`);
        }

        // Also ensure 'main' is registered 
        await client.query("INSERT INTO public.schemas (schema_name) VALUES ('main') ON CONFLICT (schema_name) DO NOTHING");
        console.log("Ensured 'main' is registered in 'schemas' table.");

    } catch (e) {
        console.error("Error fixing schemas:", e.message);
    }

    await client.end();
}

run().catch(e => console.error(e));
