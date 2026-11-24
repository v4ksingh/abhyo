const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// ── Import DB + all models (registers associations) ──
const { connectDB } = require('./config/database');
require('./models/index');

// ── Route imports ──
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const instituteRoutes = require('./routes/institute.routes');
const studentRoutes = require('./routes/student.routes');
const testRoutes = require('./routes/test.routes');
const questionRoutes = require('./routes/question.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const resultRoutes = require('./routes/result.routes');
const examSeriesRoutes = require('./routes/examSeries.routes');
const videoSeriesRoutes = require('./routes/videoSeries.routes');
const publicRoutes = require('./routes/public.routes');
const planRoutes = require('./routes/plan.routes');
const categoryRoutes = require('./routes/category.routes');
const subjectRoutes = require('./routes/subject.routes');
const seriesNoteRoutes = require('./routes/seriesNote.routes');
const lmsRoutes = require('./routes/lms.routes');
const reviewRoutes = require('./routes/review.routes');
const hrRoutes = require('./routes/hr.routes');
const cmsRoutes = require('./routes/cms.routes');
const olympiadRoutes = require('./routes/olympiad.routes');
const ebookRoutes = require('./routes/ebook.routes');
const governmentJobsRoutes = require('./routes/governmentJobs.routes');

const { errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim()) 
  : ['http://localhost:5173'];

// ── Socket.IO ──
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-test', (testId) => socket.join(`test:${testId}`));
});

// ── Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Support subpath deployment (e.g. when hosted at abhyo.com/server)
app.use((req, res, next) => {
  if (req.url.startsWith('/server/')) {
    req.url = req.url.slice(7);
  } else if (req.url === '/server') {
    req.url = '/';
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', apiLimiter);

const accountRoutes = require('./routes/account.routes');

// ── Error Handler ──
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/exam-series', examSeriesRoutes);
app.use('/api/video-series', videoSeriesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exam-series/:seriesId/notes', seriesNoteRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/olympiad', olympiadRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/government-jobs', governmentJobsRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Abhyo LMS API',
    version: '1.0.0',
    status: 'running',
    api: `http://localhost:${process.env.PORT || 5000}/api`,
    health: `http://localhost:${process.env.PORT || 5000}/api/health`,
    frontend: allowedOrigins,
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MockTest LMS API running (MySQL)', timestamp: new Date().toISOString() });
});

// ── Dynamic Public Sitemap ──
const { generateSitemapXml } = require('./utils/sitemap.util');
app.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
  try {
    const { xml } = await generateSitemapXml();
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start ──
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, async () => {
    console.log(`🚀 Server: http://localhost:${PORT}/api`);
    console.log(`💡 Health: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database: MySQL`);

    // ── Proactive Cache Warming on Server Boot ──
    try {
      const { warmAll, startPeriodicWarming } = require('./utils/cacheWarmer');
      await warmAll('server-boot');
      startPeriodicWarming(20); // Schedule background refresh every 20 minutes
    } catch (warmErr) {
      console.warn('⚠️ [Cache Warmer Notice]:', warmErr.message);
    }
  });
});

module.exports = { app, io };
