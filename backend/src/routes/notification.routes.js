const express = require('express');
const Notification = require('../models/Notification');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/customErrors');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/notifications
 * @desc Get user notifications
 */
router.get('/', asyncWrapper(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  return sendSuccess(res, 'Notifications retrieved', {
    unreadCount,
    notifications
  });
}));

/**
 * @route PATCH /api/v1/notifications/:id/read
 * @desc Mark single notification as read
 */
router.patch('/:id/read', asyncWrapper(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!notification) {
    throw new NotFoundError('Notification not found.');
  }

  notification.read = true;
  await notification.save();

  return sendSuccess(res, 'Notification marked as read', notification);
}));

/**
 * @route PATCH /api/v1/notifications/read-all
 * @desc Mark all notifications as read
 */
router.patch('/read-all', asyncWrapper(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  return sendSuccess(res, 'All notifications marked as read');
}));

module.exports = router;
