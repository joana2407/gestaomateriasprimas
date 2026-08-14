CREATE TABLE `notificacoes_qualidade` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tipo` enum('rececao_observacoes') NOT NULL DEFAULT 'rececao_observacoes',
  `titulo` varchar(255) NOT NULL,
  `mensagem` text NOT NULL,
  `link` varchar(1000) NOT NULL,
  `rececao_id` int,
  `lida` boolean NOT NULL DEFAULT false,
  `lida_em` timestamp NULL,
  `criada_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `notificacoes_qualidade_id` PRIMARY KEY(`id`),
  CONSTRAINT `notificacoes_qualidade_rececao_id_rececoes_materias_primas_id_fk`
    FOREIGN KEY (`rececao_id`) REFERENCES `rececoes_materias_primas`(`id`) ON DELETE SET NULL
);
