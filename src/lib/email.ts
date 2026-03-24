// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OcorrenciaEmail {
  alunoNome: string;
  turma: string;
  professor: string;
  disciplina?: string;
  motivo: string;
  descricao: string;
  data: string;
  estrelasDelta: number;
  estrelasTotal: number;
}

// ── Template HTML de ocorrência individual ────────────────────────────────────
function templateIndividual(o: OcorrenciaEmail): string {
  const sinalEstrelas =
    o.estrelasDelta > 0
      ? `+${o.estrelasDelta} ⭐`
      : o.estrelasDelta < 0
      ? `${o.estrelasDelta} ⭐`
      : "sem alteração";

  const corDelta =
    o.estrelasDelta > 0 ? "#16a34a" : o.estrelasDelta < 0 ? "#dc2626" : "#6b7280";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="background: #1e40af; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">📋 Registro de Ocorrência</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">${o.data}</p>
    </div>

    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 40%;">Aluno</td>
          <td style="padding: 10px 0; font-weight: bold; font-size: 14px;">${o.alunoNome}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Turma</td>
          <td style="padding: 10px 0; font-size: 14px;">${o.turma}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Professor</td>
          <td style="padding: 10px 0; font-size: 14px;">${o.professor}</td>
        </tr>
        ${o.disciplina ? `<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; color: #64748b; font-size: 14px;">Disciplina</td><td style="padding: 10px 0; font-size: 14px;">${o.disciplina}</td></tr>` : ""}
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Motivo</td>
          <td style="padding: 10px 0; font-size: 14px;">${o.motivo}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Estrelas</td>
          <td style="padding: 10px 0; font-size: 14px;">
            <span style="color: ${corDelta}; font-weight: bold;">${sinalEstrelas}</span>
            <span style="color: #64748b;"> → Total: ${o.estrelasTotal}/10</span>
          </td>
        </tr>
      </table>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; border-left: 4px solid #1e40af;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Descrição</p>
        <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">${o.descricao}</p>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistema de Ocorrências Escolares — enviado automaticamente</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Template HTML de ocorrências da turma (resumo diário) ─────────────────────
function templateTurma(
  turma: string,
  professor: string,
  data: string,
  ocorrencias: OcorrenciaEmail[]
): string {
  const rows = ocorrencias
    .map(
      (o) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 12px; font-size: 14px;">${o.alunoNome}</td>
      <td style="padding: 10px 12px; font-size: 14px;">${o.motivo}</td>
      <td style="padding: 10px 12px; font-size: 13px; color: #64748b;">${o.descricao.slice(0, 60)}${o.descricao.length > 60 ? "..." : ""}</td>
      <td style="padding: 10px 12px; font-size: 14px; text-align: center;">
        <span style="color: ${o.estrelasDelta > 0 ? "#16a34a" : o.estrelasDelta < 0 ? "#dc2626" : "#6b7280"}; font-weight: bold;">
          ${o.estrelasDelta > 0 ? "+" : ""}${o.estrelasDelta}
        </span>
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="background: #1e40af; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">📋 Ocorrências da Turma — ${turma}</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">Prof. ${professor} · ${data}</p>
    </div>

    <div style="padding: 24px 32px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">${ocorrencias.length} ocorrência(s) registrada(s) neste envio.</p>
      
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #1e40af;">
            <th style="padding: 10px 12px; text-align: left; color: #fff; font-size: 13px;">Aluno</th>
            <th style="padding: 10px 12px; text-align: left; color: #fff; font-size: 13px;">Motivo</th>
            <th style="padding: 10px 12px; text-align: left; color: #fff; font-size: 13px;">Descrição</th>
            <th style="padding: 10px 12px; text-align: center; color: #fff; font-size: 13px;">⭐</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistema de Ocorrências Escolares — enviado automaticamente</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Funções de envio ───────────────────────────────────────────────────────────

export async function enviarOcorrenciaIndividual(data: OcorrenciaEmail) {
  return resend.emails.send({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: process.env.INSTITUICAO_EMAIL!,
    subject: `[Ocorrência] ${data.alunoNome} — ${data.turma}`,
    html: templateIndividual(data),
  });
}

export async function enviarOcorrenciasTurma(
  turma: string,
  professor: string,
  data: string,
  ocorrencias: OcorrenciaEmail[]
) {
  return resend.emails.send({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: process.env.INSTITUICAO_EMAIL!,
    subject: `[Ocorrências da Turma] ${turma} — ${data}`,
    html: templateTurma(turma, professor, data, ocorrencias),
  });
}
