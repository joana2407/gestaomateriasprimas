CREATE TABLE IF NOT EXISTS `rasff_vigilancias` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(150) NOT NULL,
  `ativa` boolean NOT NULL DEFAULT true,
  `cron_expression` varchar(40) NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'Europe/Lisbon',
  `schedule_cron_task_uid` varchar(65),
  `categorias` json NOT NULL,
  `perigos` json NOT NULL,
  `created_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rasff_vigilancias_pk` PRIMARY KEY (`id`),
  CONSTRAINT `rasff_vigilancias_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  CONSTRAINT `rasff_vigilancias_schedule_uid_uq` UNIQUE (`schedule_cron_task_uid`)
);

CREATE TABLE IF NOT EXISTS `rasff_relatorios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `vigilancia_id` int NOT NULL,
  `periodo_inicio` timestamp NOT NULL,
  `periodo_fim` timestamp NOT NULL,
  `estado` enum('sucesso','sem_dados','erro') NOT NULL,
  `total_avaliados` int NOT NULL DEFAULT 0,
  `total_relevantes` int NOT NULL DEFAULT 0,
  `resumo` text NOT NULL,
  `conteudo_markdown` text NOT NULL,
  `ocorrencias` json,
  `fontes` json NOT NULL,
  `erro` text,
  `gerado_por` int,
  `gerado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `rasff_relatorios_pk` PRIMARY KEY (`id`),
  CONSTRAINT `rasff_relatorios_vigilancia_fk` FOREIGN KEY (`vigilancia_id`) REFERENCES `rasff_vigilancias`(`id`),
  CONSTRAINT `rasff_relatorios_gerado_por_fk` FOREIGN KEY (`gerado_por`) REFERENCES `users`(`id`)
);
