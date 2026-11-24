const { sequelize, connectDB } = require('../src/config/database');
const { Course, CourseModule, Lesson, CourseMaterial, Assignment, AssignmentSubmission, LessonProgress, Test, Question, Result } = require('../src/models');

const migrate = async () => {
  try {
    await connectDB();
    console.log('🔄 Creating new LMS tables...');
    
    // Create each table if not exists or alter if changed
    await Course.sync({ alter: true });
    console.log('✅ Course table ready');
    
    await CourseModule.sync({ alter: true });
    console.log('✅ CourseModule table ready');
    
    await Lesson.sync({ alter: true });
    console.log('✅ Lesson table ready');
    
    await CourseMaterial.sync({ alter: true });
    console.log('✅ CourseMaterial table ready');
    
    await Assignment.sync({ alter: true });
    console.log('✅ Assignment table ready');
    
    await AssignmentSubmission.sync({ alter: true });
    console.log('✅ AssignmentSubmission table ready');

    await LessonProgress.sync({ alter: true });
    console.log('✅ LessonProgress table ready');

    await Test.sync({ alter: true });
    console.log('✅ Test table ready');

    await Question.sync({ alter: true });
    console.log('✅ Question table ready');

    await Result.sync({ alter: true });
    console.log('✅ Result table ready');

    // For Batch, we need to add the courseId column if it doesn't exist
    // Altering specifically to add the column
    const { Batch } = require('../src/models');
    await Batch.sync({ alter: true });
    console.log('✅ Batch table updated');

    console.log('🚀 LMS Model development complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrate();
