const { Page } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function main() {
  try {
    await sequelize.authenticate();
    const page = await Page.findOne({ where: { slug: 'about' } });
    if (page) {
      let content = page.content;
      
      // Replace all purple/indigo with emerald/teal shades
      content = content.replace(/#6d28d9/g, '#059669');
      content = content.replace(/#4f46e5/g, '#10b981');
      content = content.replace(/#9333ea/g, '#047857');
      content = content.replace(/rgba\(168, 85, 247/g, 'rgba(16, 185, 129');
      content = content.replace(/rgba\(124, 58, 237/g, 'rgba(16, 185, 129');
      content = content.replace(/99, 102, 241/g, '16, 185, 129'); // box-shadow rgb

      await page.update({ content });
      console.log('About page colors updated to emerald successfully.');
    }
  } catch (error) {
    console.error('Error updating about page:', error);
  } finally {
    await sequelize.close();
  }
}

main();
