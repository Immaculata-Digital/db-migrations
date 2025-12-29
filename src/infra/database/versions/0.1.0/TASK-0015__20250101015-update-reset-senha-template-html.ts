import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Atualizar template HTML de reset de senha para incluir botão e link com variáveis
 */
export const updateResetSenhaTemplateHtml20250101015: Migration = {
  id: '20250101015',
  name: 'update-reset-senha-template-html',
  async up({ db }) {
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
          -- Atualizar HTML da campanha de reset de senha padrão
          EXECUTE format('
            UPDATE %I.campanhas_disparo
            SET html = ''<!DOCTYPE html>
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
                Olá {{nome_cliente}},
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Se você não solicitou esta alteração, por favor, ignore este e-mail. Caso contrário, clique no botão abaixo para criar uma nova senha.
              </p>
              <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="{{url_reset}}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; text-align: center;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Ou copie e cole o link abaixo no seu navegador:
              </p>
              <p style="color: #000000; font-size: 14px; line-height: 1.6; margin: 10px 0 20px 0; word-break: break-all;">
                <a href="{{url_reset}}" style="color: #1976d2; text-decoration: underline;">{{url_reset}}</a>
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Por segurança, recomendamos que você escolha uma senha forte e única. Este link expira em 2 horas.
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
                dt_altera = NOW()
            WHERE chave = ''reset_senha_padrao''
              AND tipo_envio = ''reset_senha''
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
  async down({ db }) {
    // Reverter para o HTML original (sem botão e variáveis)
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
            SET html = ''<!DOCTYPE html>
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
                dt_altera = NOW()
            WHERE chave = ''reset_senha_padrao''
              AND tipo_envio = ''reset_senha''
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}

