const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testGPT5Generation() {
  console.log('🧪 Testando geração de apresentação com GPT-5-mini...');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: "system",
          content: "You are GPT-5. Create professional HTML presentations with complete, valid HTML documents. Always include full HTML structure with head, body, CSS styles, and JavaScript functionality."
        },
        {
          role: "user",
          content: "Create a simple HTML presentation about Digital Transformation with 3 slides. Return complete HTML code."
        }
      ]
    });

    console.log('✅ GPT-5-mini respondeu com sucesso!');
    console.log('📄 Tamanho da resposta:', response.choices[0].message.content.length, 'caracteres');
    console.log('🎯 Primeiros 300 caracteres:');
    console.log(response.choices[0].message.content.substring(0, 300) + '...');

    // Verificar se é HTML válido
    const content = response.choices[0].message.content;
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      console.log('✅ Resposta contém HTML válido!');
    } else {
      console.log('⚠️ Resposta não contém HTML válido');
    }

  } catch (error) {
    console.error('❌ Erro ao testar GPT-5:', error.message);
  }
}

testGPT5Generation();