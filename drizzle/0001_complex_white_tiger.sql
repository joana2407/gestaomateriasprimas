CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entidade` varchar(50) NOT NULL,
	`entidade_id` int NOT NULL,
	`acao` enum('criado','atualizado','eliminado','aprovado','rejeitado') NOT NULL,
	`dados_anteriores` json,
	`dados_novos` json,
	`user_id` int,
	`user_name` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fabricas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(20) NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`regras` json,
	`ativa` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fabricas_id` PRIMARY KEY(`id`),
	CONSTRAINT `fabricas_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `fichas_tecnicas_fornecedor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materia_prima_id` int NOT NULL,
	`versao` varchar(20) NOT NULL DEFAULT '1.0',
	`data_emissao` timestamp NOT NULL,
	`data_validade` timestamp NOT NULL,
	`ficheiro_url` text,
	`ficheiro_key` text,
	`estado` enum('valida','a_expirar_60','a_expirar_30','expirada') NOT NULL DEFAULT 'valida',
	`notas` text,
	`uploaded_by` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fichas_tecnicas_fornecedor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fichas_tecnicas_produto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produto_id` int NOT NULL,
	`versao` int NOT NULL DEFAULT 1,
	`estado` enum('rascunho','aprovada','obsoleta') NOT NULL DEFAULT 'rascunho',
	`conteudo` json,
	`ficheiro_url` text,
	`ficheiro_key` text,
	`gerado_por` int,
	`gerado_em` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fichas_tecnicas_produto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fornecedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(150) NOT NULL,
	`codigo` varchar(50),
	`contacto` varchar(200),
	`email` varchar(320),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fornecedores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredientes_receita` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receita_id` int NOT NULL,
	`materia_prima_id` int NOT NULL,
	`quantidade` float,
	`unidade` varchar(20) DEFAULT 'g',
	`percentagem` float,
	`ordem` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredientes_receita_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materias_primas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`codigo` varchar(50),
	`fornecedor_id` int,
	`fabricas_ids` json,
	`alergenios_formulacao` json,
	`alergenios_contaminacao` json,
	`observacoes` text,
	`ativa` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materias_primas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perfil_alergenico_produto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produto_id` int NOT NULL,
	`receita_id` int NOT NULL,
	`fabrica_id` int NOT NULL,
	`resultado_q1q6` json,
	`alergenios_formulacao` json,
	`alergenios_contaminacao` json,
	`calculado_em` timestamp NOT NULL DEFAULT (now()),
	`calculado_por` int,
	CONSTRAINT `perfil_alergenico_produto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`codigo` varchar(50),
	`marca` varchar(100),
	`fabrica_id` int NOT NULL,
	`receita_id` int,
	`gama` varchar(100),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receitas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`codigo` varchar(50),
	`fabrica_id` int NOT NULL,
	`versao` int NOT NULL DEFAULT 1,
	`estado` enum('rascunho','em_revisao','aprovada','obsoleta') NOT NULL DEFAULT 'rascunho',
	`descricao` text,
	`receita_pai_id` int,
	`aprovado_por` int,
	`aprovado_em` timestamp,
	`created_by` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receitas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fichas_tecnicas_fornecedor` ADD CONSTRAINT `fichas_tecnicas_fornecedor_materia_prima_id_materias_primas_id_fk` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fichas_tecnicas_fornecedor` ADD CONSTRAINT `fichas_tecnicas_fornecedor_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fichas_tecnicas_produto` ADD CONSTRAINT `fichas_tecnicas_produto_produto_id_produtos_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fichas_tecnicas_produto` ADD CONSTRAINT `fichas_tecnicas_produto_gerado_por_users_id_fk` FOREIGN KEY (`gerado_por`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingredientes_receita` ADD CONSTRAINT `ingredientes_receita_receita_id_receitas_id_fk` FOREIGN KEY (`receita_id`) REFERENCES `receitas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingredientes_receita` ADD CONSTRAINT `ingredientes_receita_materia_prima_id_materias_primas_id_fk` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materias_primas` ADD CONSTRAINT `materias_primas_fornecedor_id_fornecedores_id_fk` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perfil_alergenico_produto` ADD CONSTRAINT `perfil_alergenico_produto_produto_id_produtos_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perfil_alergenico_produto` ADD CONSTRAINT `perfil_alergenico_produto_receita_id_receitas_id_fk` FOREIGN KEY (`receita_id`) REFERENCES `receitas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perfil_alergenico_produto` ADD CONSTRAINT `perfil_alergenico_produto_fabrica_id_fabricas_id_fk` FOREIGN KEY (`fabrica_id`) REFERENCES `fabricas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perfil_alergenico_produto` ADD CONSTRAINT `perfil_alergenico_produto_calculado_por_users_id_fk` FOREIGN KEY (`calculado_por`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_fabrica_id_fabricas_id_fk` FOREIGN KEY (`fabrica_id`) REFERENCES `fabricas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_receita_id_receitas_id_fk` FOREIGN KEY (`receita_id`) REFERENCES `receitas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receitas` ADD CONSTRAINT `receitas_fabrica_id_fabricas_id_fk` FOREIGN KEY (`fabrica_id`) REFERENCES `fabricas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receitas` ADD CONSTRAINT `receitas_aprovado_por_users_id_fk` FOREIGN KEY (`aprovado_por`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receitas` ADD CONSTRAINT `receitas_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;