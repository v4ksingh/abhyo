const fs = require('fs');
const { Test, Question } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function run() {
  await sequelize.authenticate();
  const testId = 'c7a408fb-5dcf-4f7b-8ae2-1bf21b58d098';
  const test = await Test.findByPk(testId);
  
  let qIds = test.questionIds || [];
  if (typeof qIds === 'string') qIds = JSON.parse(qIds);
  let secs = test.sections || [];
  if (typeof secs === 'string') secs = JSON.parse(secs);
  if (secs?.length > 0) qIds = secs.flatMap(s => s.questions || []);

  const questions = await Question.findAll({
    where: { id: qIds, isActive: true },
    attributes: ['id', 'questionText', 'options']
  });
  
  const result = {
    firstQuestion: questions[0] || null,
    optionsType: questions[0] ? typeof questions[0].options : null,
    isOptionsArray: questions[0] ? Array.isArray(questions[0].options) : null,
  };
  
  fs.writeFileSync('out.json', JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch(console.error);
