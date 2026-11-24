const { Page } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function main() {
  try {
    await sequelize.authenticate();
    const existing = await Page.findOne({ where: { slug: 'about' } });
    if (!existing) {
      await Page.create({
        slug: 'about',
        title: 'About Abhyo',
        content: `
          <h2>Our Mission</h2>
          <p>At Abhyo, our mission is to empower students across India with the best-in-class mock test platform, providing detailed analytics, comprehensive resources, and a seamless learning experience.</p>
          <h2>Who We Are</h2>
          <p>We are a team of educators and technologists dedicated to democratizing access to quality test preparation.</p>
        `,
        isPublished: true
      });
      console.log('About page created successfully.');
    } else {
      console.log('About page already exists.');
    }
  } catch (error) {
    console.error('Error creating about page:', error);
  } finally {
    await sequelize.close();
  }
}

main();
