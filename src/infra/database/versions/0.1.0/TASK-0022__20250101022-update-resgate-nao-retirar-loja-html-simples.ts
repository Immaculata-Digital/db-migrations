import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Atualizar HTML da campanha resgate_nao_retirar_loja_padrao para versão simplificada
 * Esta migration atualiza o template HTML para uma versão mais simples que funciona melhor na visualização do admin
 */
export const updateResgateNaoRetirarLojaHtmlSimples20250101022: Migration = {
  id: '20250101022',
  name: 'update-resgate-nao-retirar-loja-html-simples',
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
          -- Atualizar HTML da campanha resgate_nao_retirar_loja_padrao
          EXECUTE format('
            UPDATE %I.campanhas_disparo 
            SET html = ''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #F59E0B; font-size: 24px; margin-bottom: 20px;">⚠️ Novo Resgate - Ação Necessária</h1>
  
  <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; color: #92400E; font-size: 16px;">
    <strong>⚠️ ATENÇÃO:</strong> Um cliente resgatou um produto que <strong>NÃO pode ser retirado em loja</strong>.
  </p>

  <div style="background-color: #4F46E5; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; border-radius: 8px;">
    CÓDIGO: {{codigo_resgate}}
  </div>

  <h2 style="color: #4F46E5; font-size: 18px; margin-top: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Informações do Cliente</h2>
  <p style="margin: 8px 0;"><strong>Nome:</strong> {{cliente.nome_completo}}</p>
  <p style="margin: 8px 0;"><strong>E-mail:</strong> {{cliente.email}}</p>
  <p style="margin: 8px 0;"><strong>WhatsApp:</strong> {{cliente.whatsapp}}</p>
  <p style="margin: 8px 0;"><strong>CEP:</strong> {{cliente.cep}}</p>
  <p style="margin: 8px 0;"><strong>Saldo de Pontos:</strong> {{cliente.saldo}} pontos</p>

  <h2 style="color: #4F46E5; font-size: 18px; margin-top: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Informações do Item Resgatado</h2>
  <p style="margin: 8px 0;"><strong>Nome do Item:</strong> {{item.nome_item}}</p>
  <p style="margin: 8px 0;"><strong>Descrição:</strong> {{item.descricao}}</p>
  <p style="margin: 8px 0;"><strong>Pontos Utilizados:</strong> {{item.qtd_pontos}} pontos</p>
  <p style="margin: 8px 0; color: #F59E0B;"><strong>Status:</strong> ⚠️ NÃO PODE SER RETIRADO EM LOJA</p>

  <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; margin-top: 20px; border-radius: 8px;">
    <p style="margin: 0; color: #92400E; font-size: 16px;">
      <strong>📋 Ação Necessária:</strong><br>
      Entre em contato com o cliente para organizar a entrega deste produto. O código de resgate acima deve ser utilizado para confirmar a entrega.
    </p>
  </div>
</div>'',
                dt_altera = NOW()
            WHERE chave = ''resgate_nao_retirar_loja_padrao''
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
  async down({ db }) {
    // Reverter para o HTML original mais complexo
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
  <title>Novo Resgate - Item Não Retirar Loja</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #000000;">
          <tr>
            <td style="background-color: #F59E0B; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⚠️ Novo Resgate - Ação Necessária</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #92400E; font-size: 16px; margin: 0;">
                  <strong>⚠️ ATENÇÃO:</strong> Um cliente resgatou um produto que <strong>NÃO pode ser retirado em loja</strong>.
                </p>
              </div>

              <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
                CÓDIGO: {{codigo_resgate}}
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #4F46E5; font-size: 20px;">Informações do Cliente</h2>
                <table width="100%%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold; width: 40%%;">Nome:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">{{cliente.nome_completo}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold;">E-mail:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">{{cliente.email}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold;">WhatsApp:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">{{cliente.whatsapp}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold;">CEP:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">{{cliente.cep}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Saldo de Pontos:</td>
                    <td style="padding: 8px 0; color: #111827;">{{cliente.saldo}} pontos</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #4F46E5; font-size: 20px;">Informações do Item Resgatado</h2>
                <table width="100%%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold; width: 40%%;">Nome do Item:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;"><strong>{{item.nome_item}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold;">Descrição:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">{{item.descricao}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold;">Pontos Utilizados:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;"><strong>{{item.qtd_pontos}} pontos</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Status:</td>
                    <td style="padding: 8px 0; color: #F59E0B; font-weight: bold;">⚠️ NÃO PODE SER RETIRADO EM LOJA</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400E; font-size: 16px;">
                  <strong>📋 Ação Necessária:</strong><br>
                  Entre em contato com o cliente para organizar a entrega deste produto. 
                  O código de resgate acima deve ser utilizado para confirmar a entrega.
                </p>
              </div>
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
            WHERE chave = ''resgate_nao_retirar_loja_padrao''
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}
