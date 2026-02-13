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
        await client.query("INSERT INTO public.schemas (schema_name) VALUES ('main') ON CONFLICT (schema_name) DO NOTHING");
        console.log("Registered 'main' in 'schemas' table.");
    } catch (e) {
        console.error("Error registering schema:", e.message);
    }

    await client.end();
}

run().catch(e => console.error(e));
