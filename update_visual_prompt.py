#!/usr/bin/env python3
"""
Script to update VisualPromptBuilder.js with storytelling improvements
"""

import re

# Read the file
with open('services/VisualPromptBuilder.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change 1: Update CSS for slide-insight
old_css = '''/* INSIGHTS SOBRE ANÁLISES */
.slide-insight {
  position: absolute;
  bottom: 80px;
  left: 50px;
  right: 50px;
  font-size: 1rem;
  color: rgba(0,0,0,0.7);
  font-style: italic;
  font-weight: 500;
  line-height: 1.5;
  max-width: calc(100% - 100px);
  word-break: break-word;
  overflow-wrap: break-word;
}'''

new_css = '''/* INSIGHTS SOBRE ANÁLISES */
.slide-insight {
  position: absolute;
  bottom: 90px;
  left: 50px;
  right: 50px;
  font-size: 1.05rem;
  color: #1e5c3f;
  font-style: normal;
  font-weight: 600;
  line-height: 1.6;
  max-width: calc(100% - 100px);
  word-break: break-word;
  overflow-wrap: break-word;
  padding: 1.2rem 1.5rem;
  background: linear-gradient(135deg, rgba(30, 92, 63, 0.08) 0%, rgba(45, 134, 89, 0.08) 100%);
  border-left: 4px solid #ff9500;
  border-radius: 8px;
}'''

content = content.replace(old_css, new_css)

# Change 2: Update SLIDE 2 insight placeholder
old_slide2_insight = '  <p class="slide-insight">[Insight: Adicione aqui uma análise perspicaz sobre os números apresentados]</p>'
new_slide2_insight = '  <p class="slide-insight">💡 Insight: [Análise: O que esses números revelam sobre a situação atual? Identifique o principal ponto de atenção e quantifique o impacto no negócio]</p>'
content = content.replace(old_slide2_insight, new_slide2_insight)

# Change 3: Update SLIDE 3 insight placeholder
old_slide3_insight = '  <p class="slide-insight">[Insight: Interprete o gráfico e destaque tendências ou padrões relevantes]</p>'
new_slide3_insight = '  <p class="slide-insight">📊 Análise: [Interprete o gráfico: Qual é a tendência dominante? Existe um outlier? O que isso significa para a estratégia do cliente? Quantifique oportunidades]</p>'
content = content.replace(old_slide3_insight, new_slide3_insight)

# Change 4: Add insight to SLIDE 4 (Comparison)
old_slide4 = '''  </div>
</div>

SLIDE ${slideCount} - CONTATO:'''

new_slide4 = '''  </div>
  <p class="slide-insight">🎯 Impacto: [Quantifique o benefício da mudança: Quanto o cliente vai economizar/ganhar? Em quanto tempo vê o ROI? Qual o risco de não agir?]</p>
</div>

SLIDE ${slideCount} - CONTATO:'''

content = content.replace(old_slide4, new_slide4)

# Change 5: Update CHECKLIST CRÍTICO with storytelling instructions
old_checklist_start = '''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST CRÍTICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${excelDataSection ? `
⚠️ VOCÊ TEM DADOS REAIS! OBRIGATÓRIO:'''

new_checklist_start = '''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST OBRIGATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 STORYTELLING E ANÁLISE OBRIGATÓRIOS:

✓ ESTRUTURA NARRATIVA: Crie uma história coesa que guie o cliente do problema à solução
  - SLIDE 1 (Cover): Título impactante que resuma o valor da apresentação
  - SLIDE 2: Contexto atual / Situação / Problema identificado
  - SLIDE 3: Dados que comprovam o problema (com análise perspicaz)
  - SLIDE 4: Solução proposta / Oportunidade
  - SLIDE 5: Próximos passos / Call to action
  - SLIDE FINAL: Contato

✓ ANÁLISES PERSPICAZES: SEMPRE adicione insights valiosos usando <p class="slide-insight">
  - Interprete os números: O que eles significam para o negócio?
  - Identifique padrões: Existe uma tendência clara?
  - Destaque oportunidades: Como o cliente pode se beneficiar?
  - Use linguagem consultiva: "Isso representa X% de economia potencial"
  - Seja específico: Quantifique impactos sempre que possível

✓ INSIGHTS OBRIGATÓRIOS EM SLIDES COM DADOS:
  - Stats cards: Adicione <p class="slide-insight">análise do significado dos números</p>
  - Gráficos: Adicione <p class="slide-insight">interpretação de tendências e padrões</p>
  - Comparações: Adicione <p class="slide-insight">impacto da mudança proposta</p>

✓ TOM E LINGUAGEM:
  - Use tom consultivo, não apenas informativo
  - Foque em benefícios para o cliente, não apenas em features
  - Seja assertivo mas não presunçoso
  - Use verbos de ação: "Reduza", "Otimize", "Aumente", "Transforme"

${excelDataSection ? `
⚠️ VOCÊ TEM DADOS REAIS! OBRIGATÓRIO:'''

content = content.replace(old_checklist_start, new_checklist_start)

# Change 6: Update conditional chart instructions
old_chart_instruction = '✓ GERE GRÁFICOS APENAS SE: houver dados que justifiquem visualização OU o usuário solicitar explicitamente. NÃO gere gráficos apenas por gerar.'

new_chart_instruction = '''✓ GRÁFICOS CONDICIONAIS:
  - Gere gráficos APENAS quando houver dados quantitativos significativos
  - Gere gráficos APENAS quando solicitado explicitamente pelo usuário
  - NÃO gere gráficos genéricos ou placeholder
  - Se não houver dados, use slides de texto com bullets ou comparações'''

content = content.replace(old_chart_instruction, new_chart_instruction)

# Write the updated content
with open('services/VisualPromptBuilder.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ VisualPromptBuilder.js updated successfully with storytelling improvements!")
print("\nChanges applied:")
print("1. ✅ Updated CSS for .slide-insight (more prominent with background and border)")
print("2. ✅ Updated SLIDE 2 insight placeholder with meaningful example")
print("3. ✅ Updated SLIDE 3 insight placeholder with chart analysis example")
print("4. ✅ Added insight placeholder to SLIDE 4 (Comparison)")
print("5. ✅ Added comprehensive storytelling instructions to CHECKLIST")
print("6. ✅ Updated conditional chart generation instructions")
