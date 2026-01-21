import type { Migration } from '../../migrations/Migration'
import { createUsersTable20250101001 } from './TASK-0001__20250101001-create-users-table'
import { createSchemasTable20250101002 } from './TASK-0002__20250101002-create-schemas-table'
import { createCombosTable20250101003 } from './TASK-0003__20250101003-create-combos-table'
import { createClientesConcordiaTables20250101004 } from './TASK-0004__20250101004-create-clientes-concordia-tables'
import { createTenantTablesFunction20250101005 } from './TASK-0005__20250101005-create-tenant-tables-function'
import { addClientesItensRecompensaTable20250101006 } from './TASK-0006__20250101006-add-clientes-itens-recompensa-table'
import { updateConfiguracoesGlobaisFields20250101007 } from './TASK-0007__20250101007-update-configuracoes-globais-fields'
import { createComunicacoesTables20250101008 } from './TASK-0008__20250101008-create-comunicacoes-tables'
import { addDestinatariosCampanhasDisparo20250101009 } from './TASK-0009__20250101009-add-destinatarios-campanhas-disparo'
import { addClientePodeExcluirCampanhasDisparo20250101010 } from './TASK-0010__20250101010-add-cliente-pode-excluir-campanhas-disparo'
import { addResgateNaoRetirarLojaCampanha20250101011 } from './TASK-0011__20250101011-add-resgate-nao-retirar-loja-campanha'
import { addDefaultSmtpSender20250101012 } from './TASK-0012__20250101012-add-default-smtp-sender'
import { refactorUsersToSchemas20250101013 } from './TASK-0013__20250101013-refactor-users-to-schemas'
import { moveAccessGroupMembershipsToSchemas20250101014 } from './TASK-0014__20250101014-move-access-group-memberships-to-schemas'
import { updateResetSenhaTemplateHtml20250101015 } from './TASK-0015__20250101015-update-reset-senha-template-html'
import { updateCampanhasPadraoRemetenteId20250101016 } from './TASK-0016__20250101016-update-campanhas-padrao-remetente-id'
import { addUserLojasGestoras20250101017 } from './TASK-0017__20250101017-add-user-lojas-gestoras'
import { updateCreateTenantTablesAddUserLojasGestoras20250101018 } from './TASK-0018__20250101018-update-create-tenant-tables-add-user-lojas-gestoras'
import { changeUsuCadastroAlteraToUuid20250101019 } from './TASK-0019__20250101019-change-usu-cadastro-altera-to-uuid'
import { changeClientesIdUsuarioToUuid20250101020 } from './TASK-0020__20250101020-change-clientes-id-usuario-to-uuid'
import { addDataNascimentoClientes20250101021 } from './TASK-0021__20250101021-add-data-nascimento-clientes'
import { updateResgateNaoRetirarLojaHtmlSimples20250101022 } from './TASK-0022__20250101022-update-resgate-nao-retirar-loja-html-simples'

export const migrations: Migration[] = [
  createUsersTable20250101001,
  createSchemasTable20250101002,
  createCombosTable20250101003,
  createClientesConcordiaTables20250101004,
  createTenantTablesFunction20250101005,
  addClientesItensRecompensaTable20250101006,
  updateConfiguracoesGlobaisFields20250101007,
  createComunicacoesTables20250101008,
  addDestinatariosCampanhasDisparo20250101009,
  addClientePodeExcluirCampanhasDisparo20250101010,
  addResgateNaoRetirarLojaCampanha20250101011,
  addDefaultSmtpSender20250101012,
  refactorUsersToSchemas20250101013,
  moveAccessGroupMembershipsToSchemas20250101014,
  updateResetSenhaTemplateHtml20250101015,
  updateCampanhasPadraoRemetenteId20250101016,
  addUserLojasGestoras20250101017,
  updateCreateTenantTablesAddUserLojasGestoras20250101018,
  changeUsuCadastroAlteraToUuid20250101019,
  changeClientesIdUsuarioToUuid20250101020,
  addDataNascimentoClientes20250101021,
  updateResgateNaoRetirarLojaHtmlSimples20250101022,
]

