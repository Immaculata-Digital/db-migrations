CREATE TABLE public.tenants_status_enum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    icon VARCHAR NOT NULL DEFAULT 'Notification',
    sort INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    deleted_by VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.tenants_plan_enum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    icon VARCHAR NOT NULL DEFAULT 'Notification',
    sort INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    deleted_by VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL, -- Ex: acme-corp (usado na URL)
    status UUID REFERENCES public.tenants_status_enum(id) NOT NULL,
    plan UUID REFERENCES public.tenants_plan_enum(id) NOT NULL,
    settings JSONB DEFAULT '{}', -- Configurações flexíveis (logos, cores)
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    deleted_by VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.ponto_jornada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    tolerancia_diaria INTERVAL DEFAULT '00:10:00',
    intervalo_pre_assinalado BOOLEAN DEFAULT FALSE, -- Se TRUE, desconta o almoço automaticamente
    fechamento_dia TIME WITH TIME ZONE DEFAULT '00:00:00', -- Crucial para jornadas noturnas
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ponto_jornada_detalhes_tipo_dia_enum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    icon VARCHAR NOT NULL DEFAULT 'Notification',
    sort INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ponto_jornada_detalhes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    jornada_id UUID REFERENCES public.ponto_jornada(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    entrada TIME WITH TIME ZONE,
    saida TIME WITH TIME ZONE, 
    entrada_intervalo TIME WITH TIME ZONE, 
    saida_intervalo TIME WITH TIME ZONE,
    tipo_dia UUID REFERENCES public.ponto_jornada_detalhes_tipo_dia_enum(id),
    UNIQUE(jornada_id, dia_semana)
);

CREATE TABLE public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    nome VARCHAR NOT NULL,
    cpf VARCHAR(11) UNIQUE,
    matricula VARCHAR UNIQUE,
    data_admissao DATE NOT NULL,
    jornada_id UUID REFERENCES public.ponto_jornada(id),
    isento_ponto BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.ponto_batidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    funcionario_id UUID REFERENCES public.funcionarios(id),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    origem VARCHAR(20) DEFAULT 'RELOGIO', -- RELOGIO, APP, MANUAL
    nsr INT, -- Número Sequencial de Registro (obrigatório para REP físico)
    geolocalizacao POINT, -- Caso use registro via Mobile
    ignorado BOOLEAN DEFAULT FALSE, -- Caso o RH desconsidere a batida manualmente
    motivo_ajuste TEXT -- Justificativa obrigatória se houver alteração
);

CREATE TABLE public.ponto_apuracao (
    id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES public.ponto_funcionarios(id),
    data DATE NOT NULL,
    horas_trabalhadas INTERVAL DEFAULT '00:00:00',
    horas_extras INTERVAL DEFAULT '00:00:00',
    horas_faltas INTERVAL DEFAULT '00:00:00',
    adicional_noturno INTERVAL DEFAULT '00:00:00',
    saldo_banco_horas INTERVAL DEFAULT '00:00:00',
    ocorrencia VARCHAR(50), -- Ex: 'FALTA', 'FERIADO', 'ATESTADO'
    UNIQUE(funcionario_id, data)
);

-- Índice para acelerar relatórios mensais
CREATE INDEX idx_apuracao_data ON public.ponto_apuracao(data);

