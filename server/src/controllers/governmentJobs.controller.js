const { GovernmentJob, User } = require('../models');
const { Op } = require('sequelize');
const { generateJobThumbnail } = require('../services/jobThumbnail.service');

// ── Slug Helper ─────────────────────────────────────────────────────────────
const toSlug = (str) => {
  if (!str) return '';
  return str.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateUniqueSlug = async (baseStr, excludeId = null) => {
  let base = toSlug(baseStr) || `job-${Date.now()}`;
  let candidate = base;
  let count = 1;
  while (true) {
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await GovernmentJob.findOne({ where, attributes: ['id'] });
    if (!existing) return candidate;
    candidate = `${base}-${count++}`;
  }
};

// ── Sanitize helper for public outputs (strip internal/AI warnings) ─────────
const sanitizePublicJob = (job) => {
  const json = typeof job.toJSON === 'function' ? job.toJSON() : { ...job };
  delete json.dataWarnings;
  delete json.validationErrors;
  delete json.validationWarnings;
  delete json.adminNotes;
  delete json.rejectionReason;
  delete json.reviewRequired;
  delete json.reviewedBy;
  delete json.reviewedAt;
  delete json.publishedBy;
  return json;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. N8N WEBHOOK IMPORT CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/government-jobs/webhook
 * Secured by verifyWebhookApiKey middleware (x-api-key header)
 * Accepts:
 *   - Single job object
 *   - Batch object: { jobs: [ ... ] }
 *   - Direct array: [ { ... }, { ... } ]
 */
exports.webhookImportJobs = async (req, res) => {
  try {
    // 1. Normalize payload into array of job items
    let rawItems = [];
    if (Array.isArray(req.body)) {
      rawItems = req.body;
    } else if (req.body && Array.isArray(req.body.jobs)) {
      rawItems = req.body.jobs;
    } else if (req.body && typeof req.body === 'object') {
      rawItems = [req.body];
    }

    if (rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload: No job items found in request body',
      });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    const errors = [];
    const processedJobs = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const indexTag = `Item[${i}]`;

      // 2. Validate essential fields
      const rawTitle = (item.title || '').trim();
      if (!rawTitle) {
        errors.push({ index: i, error: `${indexTag}: 'title' is required and cannot be empty.` });
        continue;
      }

      const organization = (item.organization || item.org || '').trim() || 'Government of India';
      const sourceUrl = (item.sourceUrl || item.source_url || item.url || '').trim() || null;

      // Validate vacancies if provided
      let totalVacancies = 0;
      if (item.totalVacancies !== undefined && item.totalVacancies !== null && item.totalVacancies !== '') {
        const parsedVac = parseInt(item.totalVacancies, 10);
        if (isNaN(parsedVac) || parsedVac < 0) {
          errors.push({ index: i, title: rawTitle, error: `${indexTag}: 'totalVacancies' must be a valid non-negative number.` });
          continue;
        }
        totalVacancies = parsedVac;
      }

      // Validate Dates if provided
      let applicationStartDate = null;
      if (item.applicationStartDate) {
        const d = new Date(item.applicationStartDate);
        if (!isNaN(d.getTime())) {
          applicationStartDate = d.toISOString().split('T')[0];
        }
      }

      let applicationLastDate = null;
      if (item.applicationLastDate) {
        const d = new Date(item.applicationLastDate);
        if (!isNaN(d.getTime())) {
          applicationLastDate = d.toISOString().split('T')[0];
        }
      }

      // Check duplicates
      let existing = null;
      if (sourceUrl) {
        existing = await GovernmentJob.findOne({ where: { sourceUrl } });
      }
      if (!existing && rawTitle && organization) {
        existing = await GovernmentJob.findOne({ where: { title: rawTitle, organization } });
      }

      // 3. Handle duplicates & upsert rules
      if (existing) {
        // RULE: Never overwrite an approved or published job with unverified AI data!
        if (existing.status === 'published' || existing.status === 'approved') {
          duplicateCount++;
          processedJobs.push({
            id: existing.id,
            title: existing.title,
            action: 'duplicate_skipped',
            status: existing.status,
            message: `Skipped: Job is already ${existing.status} on Abhyo. Will not overwrite with unverified AI data.`,
          });
          continue;
        }

        // If job is in pending_review and upsert was explicitly requested (via body or query)
        const isUpsert = item.upsert === true || req.body.upsert === true || req.query.upsert === 'true' || req.query.upsert === true;
        if (isUpsert) {
          await existing.update({
            tagline: item.tagline || existing.tagline,
            shortName: item.shortName || existing.shortName,
            category: item.category || existing.category,
            subcategory: item.subcategory || existing.subcategory,
            description: item.description || existing.description,
            totalVacancies: totalVacancies || existing.totalVacancies,
            vacancyDetails: item.vacancyDetails || existing.vacancyDetails,
            qualification: item.qualification || existing.qualification,
            eligibilityDetails: item.eligibilityDetails || existing.eligibilityDetails,
            ageLimit: item.ageLimit || existing.ageLimit,
            salary: item.salary || existing.salary,
            salaryDetails: item.salaryDetails || existing.salaryDetails,
            applicationMode: item.applicationMode || existing.applicationMode,
            applicationStartDate: applicationStartDate || existing.applicationStartDate,
            applicationLastDate: applicationLastDate || existing.applicationLastDate,
            applicationFee: item.applicationFee || existing.applicationFee,
            howToApply: item.howToApply || existing.howToApply,
            requiredDocuments: item.requiredDocuments || existing.requiredDocuments,
            selectionProcess: item.selectionProcess || existing.selectionProcess,
            examPattern: item.examPattern || existing.examPattern,
            importantDates: item.importantDates || existing.importantDates,
            officialNotificationUrl: item.officialNotificationUrl || existing.officialNotificationUrl,
            officialWebsite: item.officialWebsite || existing.officialWebsite,
            applyLink: item.applyLink || existing.applyLink,
            dataWarnings: item.dataWarnings || existing.dataWarnings,
            validationStatus: item.validationStatus || existing.validationStatus,
            validationErrors: item.validationErrors || existing.validationErrors,
            validationWarnings: item.validationWarnings || existing.validationWarnings,
            // Enforce review status
            status: 'pending_review',
            verificationStatus: 'pending',
            reviewRequired: true,
            extractedAt: item.extractedAt ? new Date(item.extractedAt) : new Date(),
          });

          updatedCount++;
          processedJobs.push({
            id: existing.id,
            title: existing.title,
            action: 'updated',
            status: 'pending_review',
          });
          continue;
        }

        // Duplicate detected without upsert
        duplicateCount++;
        processedJobs.push({
          id: existing.id,
          title: existing.title,
          action: 'duplicate_skipped',
          status: existing.status,
          message: 'Skipped: Duplicate job already exists in pending review.',
        });
        continue;
      }

      // 4. Create new job record
      const slug = await generateUniqueSlug(item.shortName || rawTitle);

      const newJob = await GovernmentJob.create({
        title: rawTitle,
        shortName: item.shortName || null,
        slug,
        tagline: item.tagline || null,
        organization,
        category: (item.category || 'General').trim(),
        subcategory: item.subcategory || null,
        description: item.description || null,
        totalVacancies,
        vacancyDetails: Array.isArray(item.vacancyDetails) ? item.vacancyDetails : [],
        qualification: Array.isArray(item.qualification) ? item.qualification : (item.qualification ? [item.qualification] : []),
        eligibilityDetails: item.eligibilityDetails || null,
        ageLimit: item.ageLimit || {},
        salary: item.salary || null,
        salaryDetails: item.salaryDetails || [],
        applicationMode: item.applicationMode || 'Online',
        applicationStartDate,
        applicationLastDate,
        applicationFee: item.applicationFee || [],
        howToApply: item.howToApply || [],
        requiredDocuments: item.requiredDocuments || [],
        selectionProcess: item.selectionProcess || [],
        examPattern: item.examPattern || [],
        importantDates: item.importantDates || [],
        officialNotificationUrl: item.officialNotificationUrl || null,
        officialWebsite: item.officialWebsite || null,
        applyLink: item.applyLink || null,
        source: item.source || 'FreeJobAlert',
        sourceUrl,
        // AI extraction & strict review enforcement
        aiExtracted: true,
        extractedAt: item.extractedAt ? new Date(item.extractedAt) : new Date(),
        verificationStatus: 'pending',
        reviewRequired: true,
        dataWarnings: item.dataWarnings || [],
        validationStatus: item.validationStatus || 'passed',
        validationErrors: item.validationErrors || [],
        validationWarnings: item.validationWarnings || [],
        // Publication status
        status: 'pending_review',
        isFeatured: false,
      });

      createdCount++;
      processedJobs.push({
        id: newJob.id,
        title: newJob.title,
        slug: newJob.slug,
        action: 'created',
        status: 'pending_review',
      });
    }

    let statusCode = 200;
    if (createdCount > 0) {
      statusCode = 201;
    } else if (errors.length > 0 && createdCount === 0 && updatedCount === 0 && duplicateCount === 0) {
      statusCode = 400;
    }

    const isFailure = statusCode === 400;

    return res.status(statusCode).json({
      success: !isFailure,
      message: isFailure ? 'Failed to import government jobs: input validation failed' : 'Government jobs processed successfully',
      count: rawItems.length,
      created: createdCount,
      updated: updatedCount,
      duplicates: duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
      data: processedJobs,
    });
  } catch (err) {
    console.error('[GovernmentJobs Webhook Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process government jobs webhook',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ADMIN CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/government-jobs/admin
 * Paginated, filtered, searchable job list for administrators
 */
exports.adminGetJobs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    const { status, category, organization, source, search, sortBy, sortOrder, deadlineFilter } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (organization && organization !== 'all') {
      where.organization = organization;
    }

    if (source && source !== 'all') {
      where.source = source;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: q } },
        { shortName: { [Op.like]: q } },
        { organization: { [Op.like]: q } },
        { sourceUrl: { [Op.like]: q } },
      ];
    }

    // Application deadline filter
    const today = new Date().toISOString().split('T')[0];
    if (deadlineFilter === 'closing_soon') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      where.applicationLastDate = {
        [Op.gte]: today,
        [Op.lte]: nextWeek,
      };
    } else if (deadlineFilter === 'active') {
      where.applicationLastDate = { [Op.gte]: today };
    } else if (deadlineFilter === 'expired') {
      where.applicationLastDate = { [Op.lt]: today };
    }

    // Sorting
    const validSortCols = ['createdAt', 'applicationLastDate', 'totalVacancies', 'title', 'status', 'publishedAt'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await GovernmentJob.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderCol, orderDir]],
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'publisher', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('[adminGetJobs Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/government-jobs/admin/stats
 * Overview dashboard stats for administrators
 */
exports.adminGetStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalJobs,
      pendingReview,
      approved,
      published,
      rejected,
      addedToday,
    ] = await Promise.all([
      GovernmentJob.count(),
      GovernmentJob.count({ where: { status: 'pending_review' } }),
      GovernmentJob.count({ where: { status: 'approved' } }),
      GovernmentJob.count({ where: { status: 'published' } }),
      GovernmentJob.count({ where: { status: 'rejected' } }),
      GovernmentJob.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
    ]);

    // Category distribution
    const categoryCounts = await GovernmentJob.findAll({
      attributes: ['category', [GovernmentJob.sequelize.fn('COUNT', GovernmentJob.sequelize.col('id')), 'count']],
      group: ['category'],
      order: [[GovernmentJob.sequelize.literal('count'), 'DESC']],
      limit: 8,
    });

    // Upcoming application deadlines (next 5 published or approved jobs)
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingDeadlines = await GovernmentJob.findAll({
      where: {
        applicationLastDate: { [Op.gte]: todayStr },
        status: { [Op.in]: ['published', 'approved'] },
      },
      attributes: ['id', 'title', 'organization', 'applicationLastDate', 'totalVacancies', 'slug', 'status'],
      order: [['applicationLastDate', 'ASC']],
      limit: 5,
    });

    // Recent activity (latest imports or review actions)
    const recentActivity = await GovernmentJob.findAll({
      attributes: ['id', 'title', 'organization', 'status', 'aiExtracted', 'createdAt', 'reviewedAt', 'publishedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 6,
    });

    res.json({
      success: true,
      data: {
        totalJobs,
        pendingReview,
        approved,
        published,
        rejected,
        addedToday,
        categoryDistribution: categoryCounts.map(c => ({
          category: c.category,
          count: parseInt(c.get('count'), 10),
        })),
        upcomingDeadlines,
        recentActivity,
      },
    });
  } catch (err) {
    console.error('[adminGetStats Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/government-jobs/admin/:id
 * Single job details with reviewer/publisher info
 */
exports.adminGetJobById = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id, {
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'publisher', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    res.json({ success: true, data: job });
  } catch (err) {
    console.error('[adminGetJobById Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/government-jobs/admin
 * Create a new government job manually
 */
exports.adminCreateJob = async (req, res) => {
  try {
    const {
      title, shortName, tagline, organization, category, subcategory, description,
      totalVacancies, vacancyDetails, qualification, eligibilityDetails, ageLimit,
      salary, salaryDetails, applicationMode, applicationStartDate, applicationLastDate,
      applicationFee, howToApply, requiredDocuments, selectionProcess, examPattern,
      importantDates, officialNotificationUrl, officialWebsite, applyLink, source,
      sourceUrl, adminNotes, isFeatured, status,
    } = req.body;

    if (!title || !organization) {
      return res.status(400).json({ success: false, error: 'Title and Organization are required' });
    }

    const slug = await generateUniqueSlug(shortName || title);

    const job = await GovernmentJob.create({
      title: title.trim(),
      shortName: shortName ? shortName.trim() : null,
      slug,
      tagline: tagline || null,
      organization: organization.trim(),
      category: category || 'General',
      subcategory: subcategory || null,
      description: description || null,
      totalVacancies: parseInt(totalVacancies) || 0,
      vacancyDetails: Array.isArray(vacancyDetails) ? vacancyDetails : [],
      qualification: Array.isArray(qualification) ? qualification : [],
      eligibilityDetails: eligibilityDetails || null,
      ageLimit: ageLimit || {},
      salary: salary || null,
      salaryDetails: Array.isArray(salaryDetails) ? salaryDetails : [],
      applicationMode: applicationMode || 'Online',
      applicationStartDate: applicationStartDate || null,
      applicationLastDate: applicationLastDate || null,
      applicationFee: Array.isArray(applicationFee) ? applicationFee : [],
      howToApply: Array.isArray(howToApply) ? howToApply : [],
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      selectionProcess: Array.isArray(selectionProcess) ? selectionProcess : [],
      examPattern: Array.isArray(examPattern) ? examPattern : [],
      importantDates: Array.isArray(importantDates) ? importantDates : [],
      officialNotificationUrl: officialNotificationUrl || null,
      officialWebsite: officialWebsite || null,
      applyLink: applyLink || null,
      source: source || 'Manual Entry',
      sourceUrl: sourceUrl || null,
      adminNotes: adminNotes || null,
      isFeatured: !!isFeatured,
      status: status || 'approved',
      aiExtracted: false,
      verificationStatus: 'verified',
    });

    res.status(201).json({
      success: true,
      message: 'Government job created successfully',
      data: job,
    });
  } catch (err) {
    console.error('[adminCreateJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/government-jobs/admin/:id
 * Edit government job details
 */
exports.adminUpdateJob = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    const updatableFields = [
      'title', 'shortName', 'tagline', 'organization', 'category', 'subcategory', 'description',
      'totalVacancies', 'vacancyDetails', 'qualification', 'eligibilityDetails', 'ageLimit',
      'salary', 'salaryDetails', 'applicationMode', 'applicationStartDate', 'applicationLastDate',
      'applicationFee', 'howToApply', 'requiredDocuments', 'selectionProcess', 'examPattern',
      'importantDates', 'officialNotificationUrl', 'officialWebsite', 'applyLink', 'source',
      'sourceUrl', 'adminNotes', 'isFeatured',
    ];

    const updates = {};
    updatableFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // If title changed, refresh unique slug
    if (updates.title && updates.title !== job.title) {
      updates.slug = await generateUniqueSlug(updates.shortName || updates.title, job.id);
    }

    await job.update(updates);

    res.json({
      success: true,
      message: 'Government job updated successfully',
      data: job,
    });
  } catch (err) {
    console.error('[adminUpdateJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/government-jobs/admin/:id/approve
 * Marks a job as approved after admin review
 */
exports.adminApproveJob = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    await job.update({
      status: 'approved',
      verificationStatus: 'verified',
      reviewRequired: false,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: null,
      adminNotes: req.body.adminNotes !== undefined ? req.body.adminNotes : job.adminNotes,
    });

    res.json({
      success: true,
      message: 'Government job approved successfully',
      data: job,
    });
  } catch (err) {
    console.error('[adminApproveJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/government-jobs/admin/:id/reject
 * Marks a job as rejected with a reason
 */
exports.adminRejectJob = async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    await job.update({
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason.trim(),
      adminNotes: adminNotes !== undefined ? adminNotes : job.adminNotes,
    });

    res.json({
      success: true,
      message: 'Government job rejected',
      data: job,
    });
  } catch (err) {
    console.error('[adminRejectJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/government-jobs/admin/:id/publish
 * Publishes an approved job to make it visible on Abhyo.com
 */
exports.adminPublishJob = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    // MANDATORY PUBLISHING SAFEGUARDS
    if (job.status !== 'approved' && !req.body.overrideApproval) {
      return res.status(400).json({
        success: false,
        error: 'Job must be reviewed and approved before publishing.',
      });
    }

    if (!job.title || !job.organization) {
      return res.status(400).json({
        success: false,
        error: 'Job requires a valid title and organization to publish.',
      });
    }

    // Official notification check or documented exception
    if (!job.officialNotificationUrl && !job.officialWebsite && !req.body.allowWithoutOfficialUrl) {
      return res.status(400).json({
        success: false,
        error: 'Official notification URL or official website is required before publishing.',
      });
    }

    await job.update({
      status: 'published',
      publishedAt: new Date(),
      publishedBy: req.user.id,
      reviewRequired: false,
    });

    res.json({
      success: true,
      message: 'Government job published to Abhyo.com',
      data: job,
    });
  } catch (err) {
    console.error('[adminPublishJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/government-jobs/admin/:id/unpublish
 * Unpublishes an active job
 */
exports.adminUnpublishJob = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    await job.update({
      status: 'unpublished',
    });

    res.json({
      success: true,
      message: 'Government job unpublished',
      data: job,
    });
  } catch (err) {
    console.error('[adminUnpublishJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/government-jobs/admin/:id/feature
 * Toggles isFeatured status
 */
exports.adminToggleFeature = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    await job.update({ isFeatured: !job.isFeatured });

    res.json({
      success: true,
      message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: job,
    });
  } catch (err) {
    console.error('[adminToggleFeature Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/government-jobs/admin/:id
 * Deletes a job (superadmin & admin only)
 */
exports.adminDeleteJob = async (req, res) => {
  try {
    const job = await GovernmentJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job not found' });
    }

    await job.destroy();

    res.json({
      success: true,
      message: 'Government job deleted successfully',
    });
  } catch (err) {
    console.error('[adminDeleteJob Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/government-jobs/admin/:id/generate-thumbnail
 * Generates dynamic 1200x630 recruitment poster thumbnail, updates job record, and returns image URL.
 */
exports.adminGenerateThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await GovernmentJob.findByPk(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Government job recruitment not found',
      });
    }

    // Generate dynamic thumbnail PNG using Playwright service
    const { imageUrl } = await generateJobThumbnail(job);

    // Update the GovernmentJob thumbnailImage field in MySQL
    await job.update({
      thumbnailImage: imageUrl,
    });

    res.json({
      success: true,
      message: 'Government job thumbnail generated successfully',
      imageUrl,
      data: {
        id: job.id,
        title: job.title,
        thumbnailImage: imageUrl,
      },
    });
  } catch (err) {
    console.error('[adminGenerateThumbnail Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to generate job thumbnail: ${err.message}`,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PUBLIC CONTROLLERS (ONLY status === 'published')
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/government-jobs
 * Public listing of published government jobs
 */
exports.publicGetJobs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const { category, search, deadlineFilter, featured } = req.query;

    // RULE: Only published jobs can EVER appear publicly!
    const where = { status: 'published' };

    if (category && category !== 'All' && category !== 'all') {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: q } },
        { shortName: { [Op.like]: q } },
        { organization: { [Op.like]: q } },
      ];
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (deadlineFilter === 'closing_soon') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      where.applicationLastDate = {
        [Op.gte]: todayStr,
        [Op.lte]: nextWeek,
      };
    } else if (deadlineFilter === 'open') {
      where.applicationLastDate = { [Op.gte]: todayStr };
    }

    const { count, rows } = await GovernmentJob.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['isFeatured', 'DESC'],
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      attributes: {
        exclude: ['dataWarnings', 'validationErrors', 'validationWarnings', 'adminNotes', 'rejectionReason'],
      },
    });

    const sanitizedRows = rows.map(sanitizePublicJob);

    res.json({
      success: true,
      data: sanitizedRows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('[publicGetJobs Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/government-jobs/:slug
 * Public detail page for a published job
 */
exports.publicGetJobBySlug = async (req, res) => {
  try {
    const job = await GovernmentJob.findOne({
      where: {
        slug: req.params.slug,
        status: 'published', // Strict security: ONLY published jobs
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Government job recruitment not found or not published' });
    }

    // Also fetch 3 related jobs from the same category
    const relatedJobs = await GovernmentJob.findAll({
      where: {
        category: job.category,
        id: { [Op.ne]: job.id },
        status: 'published',
      },
      limit: 3,
      attributes: ['id', 'title', 'slug', 'organization', 'category', 'totalVacancies', 'applicationLastDate'],
    });

    res.json({
      success: true,
      data: sanitizePublicJob(job),
      related: relatedJobs.map(sanitizePublicJob),
    });
  } catch (err) {
    console.error('[publicGetJobBySlug Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/government-jobs/categories/summary
 * Returns distinct public categories with active job count
 */
exports.publicGetCategories = async (req, res) => {
  try {
    const counts = await GovernmentJob.findAll({
      where: { status: 'published' },
      attributes: ['category', [GovernmentJob.sequelize.fn('COUNT', GovernmentJob.sequelize.col('id')), 'count']],
      group: ['category'],
      order: [[GovernmentJob.sequelize.literal('count'), 'DESC']],
    });

    res.json({
      success: true,
      data: counts.map(c => ({
        name: c.category,
        count: parseInt(c.get('count'), 10),
      })),
    });
  } catch (err) {
    console.error('[publicGetCategories Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
