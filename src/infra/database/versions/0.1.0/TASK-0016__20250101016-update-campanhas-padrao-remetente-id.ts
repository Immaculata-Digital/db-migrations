import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Atualizar remetente_id das campanhas padrão para usar o remetente com email no-reply@immaculatadigital.com.br
 */
export const updateCampanhasPadraoRemetenteId20250101016: Migration = {
  id: '20250101016',
  name: 'update-campanhas-padrao-remetente-id',
  async up({ db }) {
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        -- Iterar sobre todos os schemas que têm as tabelas necessárias
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          AND EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'campanhas_disparo'
          )
          AND EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'remetentes_smtp'
          )
        LOOP
          -- Atualizar campanhas padrão usando subquery para buscar o remetente_id
          EXECUTE format('
            UPDATE %I.campanhas_disparo
            SET remetente_id = (
              SELECT id_remetente
              FROM %I.remetentes_smtp
              WHERE email = ''no-reply@immaculatadigital.com.br''
              LIMIT 1
            ),
            dt_altera = NOW()
            WHERE chave IN (
              ''boas_vindas_padrao'',
              ''atualizacao_pontos_padrao'',
              ''resgate_padrao'',
              ''reset_senha_padrao'',
              ''resgate_nao_retirar_loja_padrao''
            )
            AND EXISTS (
              SELECT 1
              FROM %I.remetentes_smtp
              WHERE email = ''no-reply@immaculatadigital.com.br''
            )
            AND (
              remetente_id IS NULL 
              OR remetente_id != (
                SELECT id_remetente
                FROM %I.remetentes_smtp
                WHERE email = ''no-reply@immaculatadigital.com.br''
                LIMIT 1
              )
            )
          ', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
  async down({ db }) {
    // Reverter: remover remetente_id das campanhas padrão (definir como NULL)
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          AND EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'campanhas_disparo'
          )
        LOOP
          EXECUTE format('
            UPDATE %I.campanhas_disparo
            SET remetente_id = NULL,
                dt_altera = NOW()
            WHERE chave IN (
              ''boas_vindas_padrao'',
              ''atualizacao_pontos_padrao'',
              ''resgate_padrao'',
              ''reset_senha_padrao'',
              ''resgate_nao_retirar_loja_padrao''
            )
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}

