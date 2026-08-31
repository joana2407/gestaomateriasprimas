-- Permite distinguir alertas RASFF relevantes e ligá-los ao relatório/ocorrência.
ALTER TABLE notificacoes_qualidade
  MODIFY COLUMN tipo ENUM('rececao_observacoes', 'rececao_validacao_condicional', 'rasff_relevante') NOT NULL DEFAULT 'rececao_observacoes',
  ADD COLUMN rasff_relatorio_id INT NULL,
  ADD COLUMN rasff_chave VARCHAR(180) NULL;

ALTER TABLE notificacoes_qualidade
  ADD CONSTRAINT notificacoes_qualidade_rasff_relatorio_fk
  FOREIGN KEY (rasff_relatorio_id) REFERENCES rasff_relatorios(id) ON DELETE SET NULL;

CREATE INDEX notificacoes_qualidade_rasff_idx
  ON notificacoes_qualidade (tipo, rasff_relatorio_id, rasff_chave);
