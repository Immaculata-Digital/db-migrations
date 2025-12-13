import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Adicionar campo cliente_pode_excluir na tabela campanhas_disparo
 * E inserir campanhas padrão para tipos automáticos
 */
export const addClientePodeExcluirCampanhasDisparo20250101010: Migration = {
  id: '20250101010',
  name: 'add-cliente-pode-excluir-campanhas-disparo',
  async up({ db }) {
    // Adicionar campo cliente_pode_excluir em todos os schemas
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        -- Iterar sobre todos os schemas que têm a tabela campanhas_disparo
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
          -- Primeiro, alterar remetente_id para permitir NULL (se ainda não permitir)
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            ALTER COLUMN remetente_id DROP NOT NULL
          ', schema_record.schema_name);
          
          -- Adicionar campo cliente_pode_excluir se não existir
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            ADD COLUMN IF NOT EXISTS cliente_pode_excluir BOOLEAN NOT NULL DEFAULT true
          ', schema_record.schema_name);
          
          -- Comentário na coluna
          EXECUTE format('
            COMMENT ON COLUMN %I.campanhas_disparo.cliente_pode_excluir IS ''Indica se o cliente pode excluir esta campanha (false para campanhas padrão do sistema)''
          ', schema_record.schema_name);
          
          -- Inserir campanhas padrão que estiverem faltando
          -- A migration verifica cada campanha usando WHERE NOT EXISTS e insere apenas as que não existem
          -- Isso garante que todas as 4 campanhas padrão sejam criadas, mesmo se algumas já existirem
          
          -- Campanha: Boas Vindas
          EXECUTE format('
            INSERT INTO %I.campanhas_disparo (
              id_campanha, tipo, descricao, assunto, html, remetente_id, tipo_envio,
              status, total_enviados, total_entregues, total_abertos, total_cliques,
              chave, tipo_destinatario, cliente_pode_excluir, dt_cadastro, usu_cadastro
            )
            SELECT 
              gen_random_uuid(),
              ''email'',
              ''Boas Vindas'',
              ''Bem-vindo(a) à nossa plataforma!'',
              ''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo(a)!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #000000;">
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo(a)!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                É com grande prazer que damos as boas-vindas à nossa plataforma! Estamos muito felizes em tê-lo(a) conosco.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Aqui você encontrará diversas funcionalidades e benefícios exclusivos. Explore nossa plataforma e descubra tudo o que temos a oferecer.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0;">
                Se tiver alguma dúvida, nossa equipe está sempre pronta para ajudar.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #000000; padding: 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                © Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'',
              NULL,
              ''boas_vindas'',
              ''rascunho'',
              0, 0, 0, 0,
              ''boas_vindas_padrao'',
              ''todos'',
              false,
              NOW(),
              1
            WHERE NOT EXISTS (
              SELECT 1 FROM %I.campanhas_disparo WHERE chave = ''boas_vindas_padrao''
            )
          ', schema_record.schema_name, schema_record.schema_name);
          
          -- Campanha: Atualização de Pontos
          EXECUTE format('
            INSERT INTO %I.campanhas_disparo (
              id_campanha, tipo, descricao, assunto, html, remetente_id, tipo_envio,
              status, total_enviados, total_entregues, total_abertos, total_cliques,
              chave, tipo_destinatario, cliente_pode_excluir, dt_cadastro, usu_cadastro
            )
            SELECT 
              gen_random_uuid(),
              ''email'',
              ''Atualização de Pontos'',
              ''Seus pontos foram atualizados!'',
              ''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atualização de Pontos</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #000000;">
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Atualização de Pontos</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Informamos que seus pontos foram atualizados em nossa plataforma.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Acesse sua conta para visualizar seu saldo atual e aproveitar os benefícios disponíveis.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0;">
                Continue acumulando pontos e desfrute de todas as vantagens!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #000000; padding: 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                © Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'',
              NULL,
              ''atualizacao_pontos'',
              ''rascunho'',
              0, 0, 0, 0,
              ''atualizacao_pontos_padrao'',
              ''todos'',
              false,
              NOW(),
              1
            WHERE NOT EXISTS (
              SELECT 1 FROM %I.campanhas_disparo WHERE chave = ''atualizacao_pontos_padrao''
            )
          ', schema_record.schema_name, schema_record.schema_name);
          
          -- Campanha: Resgate
          EXECUTE format('
            INSERT INTO %I.campanhas_disparo (
              id_campanha, tipo, descricao, assunto, html, remetente_id, tipo_envio,
              status, total_enviados, total_entregues, total_abertos, total_cliques,
              chave, tipo_destinatario, cliente_pode_excluir, dt_cadastro, usu_cadastro
            )
            SELECT 
              gen_random_uuid(),
              ''email'',
              ''Resgate'',
              ''Resgate realizado com sucesso!'',
              ''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resgate Realizado</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #000000;">
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Resgate Realizado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Confirmamos que seu resgate foi realizado com sucesso!
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Em breve você receberá mais informações sobre a entrega ou disponibilização do seu resgate.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0;">
                Agradecemos por fazer parte do nosso programa de fidelidade!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #000000; padding: 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                © Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'',
              NULL,
              ''resgate'',
              ''rascunho'',
              0, 0, 0, 0,
              ''resgate_padrao'',
              ''todos'',
              false,
              NOW(),
              1
            WHERE NOT EXISTS (
              SELECT 1 FROM %I.campanhas_disparo WHERE chave = ''resgate_padrao''
            )
          ', schema_record.schema_name, schema_record.schema_name);
          
          -- Campanha: Reset de Senha
          EXECUTE format('
            INSERT INTO %I.campanhas_disparo (
              id_campanha, tipo, descricao, assunto, html, remetente_id, tipo_envio,
              status, total_enviados, total_entregues, total_abertos, total_cliques,
              chave, tipo_destinatario, cliente_pode_excluir, dt_cadastro, usu_cadastro
            )
            SELECT 
              gen_random_uuid(),
              ''email'',
              ''Reset de Senha'',
              ''Redefinição de Senha'',
              ''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #000000;">
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Redefinição de Senha</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Se você não solicitou esta alteração, por favor, ignore este e-mail. Caso contrário, utilize o link abaixo para criar uma nova senha.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0;">
                Por segurança, recomendamos que você escolha uma senha forte e única.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #000000; padding: 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                © Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'',
              NULL,
              ''reset_senha'',
              ''rascunho'',
              0, 0, 0, 0,
              ''reset_senha_padrao'',
              ''todos'',
              false,
              NOW(),
              1
            WHERE NOT EXISTS (
              SELECT 1 FROM %I.campanhas_disparo WHERE chave = ''reset_senha_padrao''
            )
          ', schema_record.schema_name, schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
  async down({ db }) {
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
          -- Remover campanhas padrão
          EXECUTE format('
            DELETE FROM %I.campanhas_disparo 
            WHERE chave IN (''boas_vindas_padrao'', ''atualizacao_pontos_padrao'', ''resgate_padrao'', ''reset_senha_padrao'')
          ', schema_record.schema_name);
          
          -- Remover coluna
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            DROP COLUMN IF EXISTS cliente_pode_excluir
          ', schema_record.schema_name);
          
          -- Tentar restaurar NOT NULL no remetente_id (pode falhar se houver registros com NULL)
          -- Nota: Isso pode falhar se ainda houver campanhas com remetente_id NULL
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            ALTER COLUMN remetente_id SET NOT NULL
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}

