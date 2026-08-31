-- Distingue relatórios semanais de análises manuais carregadas pela Qualidade.
ALTER TABLE rasff_relatorios
  ADD COLUMN origem ENUM('semanal', 'manual') NOT NULL DEFAULT 'semanal',
  ADD COLUMN ficheiro_origem VARCHAR(255) NULL;

CREATE INDEX rasff_relatorios_origem_idx
  ON rasff_relatorios (origem, gerado_em);
