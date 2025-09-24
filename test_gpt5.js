const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testGPT5() {
  console.log('🧪 Testando modelos OpenAI disponíveis...');

  try {
    // Primeiro, listar modelos disponíveis
    const models = await openai.models.list();
    console.log('\n📋 Modelos disponíveis:');

    const gptModels = models.data.filter(model =>
      model.id.includes('gpt') ||
      model.id.includes('o1')
    );

    gptModels.forEach(model => {
      console.log(`- ${model.id}`);
    });

    // Testar GPT-5-mini especificamente
    console.log('\n🧪 Testando GPT-5-mini...');
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: "user",
            content: "Responda apenas: GPT-5 funcionando"
          }
        ]
      });

      console.log('✅ GPT-5-mini funcionou:', response.choices[0].message.content);
    } catch (error) {
      console.log('❌ GPT-5-mini não disponível:', error.message);

      // Testar GPT-4o
      console.log('\n🧪 Testando GPT-4o...');
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: "user",
              content: "Responda apenas: GPT-4o funcionando"
            }
          ]
        });

        console.log('✅ GPT-4o funcionou:', response.choices[0].message.content);
      } catch (error) {
        console.log('❌ GPT-4o não disponível:', error.message);

        // Testar GPT-4o-mini como fallback
        console.log('\n🧪 Testando GPT-4o-mini...');
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: "user",
                content: "Responda apenas: GPT-4o-mini funcionando"
              }
            ]
          });

          console.log('✅ GPT-4o-mini funcionou:', response.choices[0].message.content);
        } catch (error) {
          console.log('❌ GPT-4o-mini não disponível:', error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao conectar com OpenAI:', error.message);
  }
}

testGPT5();