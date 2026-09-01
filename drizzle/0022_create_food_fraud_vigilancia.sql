-- Migração manual 0022: Vigilância mensal Food Fraud.
-- Mantém-se deliberadamente limitada às novas estruturas para evitar renomeações
-- incorretas provocadas pelo histórico incompleto do drizzle-kit neste projeto.

CREATE TABLE IF NOT EXISTS `food_fraud_vigilancias` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(150) NOT NULL,
  `ativa` boolean NOT NULL DEFAULT true,
  `periodicidade` enum('mensal') NOT NULL DEFAULT 'mensal',
  `cron_expression` varchar(40) NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'Europe/Lisbon',
  `schedule_cron_task_uid` varchar(65),
  `categorias` json NOT NULL,
  `fontes` json NOT NULL,
  `created_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `food_fraud_vigilancias_pk` PRIMARY KEY (`id`),
  CONSTRAINT `food_fraud_vigilancias_schedule_uid_unique` UNIQUE (`schedule_cron_task_uid`),
  CONSTRAINT `food_fraud_vigilancias_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `food_fraud_relatorios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `vigilancia_id` int NOT NULL,
  `periodo_inicio` timestamp NOT NULL,
  `periodo_fim` timestamp NOT NULL,
  `ano_mes` varchar(7) NOT NULL,
  `nome_ficheiro` varchar(180) NOT NULL,
  `origem` enum('mensal','manual') NOT NULL DEFAULT 'mensal',
  `ficheiro_origem` varchar(255),
  `estado` enum('sucesso','sem_dados','erro') NOT NULL,
  `total_avaliados` int NOT NULL DEFAULT 0,
  `total_relevantes` int NOT NULL DEFAULT 0,
  `resumo` text NOT NULL,
  `ocorrencias` json,
  `fontes` json NOT NULL,
  `erro` text,
  `gerado_por` int,
  `gerado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `food_fraud_relatorios_pk` PRIMARY KEY (`id`),
  CONSTRAINT `food_fraud_relatorios_vigilancia_fk` FOREIGN KEY (`vigilancia_id`) REFERENCES `food_fraud_vigilancias`(`id`),
  CONSTRAINT `food_fraud_relatorios_gerado_por_fk` FOREIGN KEY (`gerado_por`) REFERENCES `users`(`id`)
);

ALTER TABLE `notificacoes_qualidade`
  MODIFY COLUMN `tipo` enum('rececao_observacoes','rececao_validacao_condicional','rasff_relevante','food_fraud_relevante') NOT NULL DEFAULT 'rececao_observacoes';
