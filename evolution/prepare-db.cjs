const {Client}=require('pg');
async function prepareDatabase(ClientType=Client,environment=process.env,log=console.log){
 const database='dentora_evolution';
 const target=new URL(environment.DATABASE_CONNECTION_URI);
 const admin=new URL(environment.DATABASE_ADMIN_URI);
 if(target.pathname!=='/'+database||target.hostname!==admin.hostname||target.port!==admin.port)throw Error('Unexpected Evolution database configuration');
 const client=new ClientType({connectionString:admin.toString(),connectionTimeoutMillis:20000,statement_timeout:20000});
 try{
  await client.connect();
  const existing=await client.query('SELECT datname FROM pg_database WHERE datname=$1',[database]);
  if(existing.rowCount===0){await client.query('CREATE DATABASE dentora_evolution');log('[Dentora Evolution] Created the separate Evolution database.');}
 }finally{await client.end();}
 const own=new ClientType({connectionString:target.toString(),connectionTimeoutMillis:20000,statement_timeout:20000});
 try{
  await own.connect();
  const tables=await own.query("SELECT tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')");
  if(tables.rows.some(row=>['workflow_entity','credentials_entity','execution_entity'].includes(row.tablename)))throw Error('Refusing to migrate an n8n database');
  log('[Dentora Evolution] Database target verified; migrations may run.');
 }finally{await own.end();}
}
module.exports={prepareDatabase};
if(require.main===module)prepareDatabase().catch(error=>{console.error('[Dentora Evolution] Database preparation failed: '+(error.code||error.name));process.exitCode=1;});
