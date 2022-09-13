import { body } from 'express-validator';

export const userValidation = [
  body('userId').exists().withMessage('userId must be provided'),
  body('isUploader').isBoolean().withMessage('isUploader must be a valid'),
  body('isAdmin').isBoolean().withMessage('isAdmin must be a valid'),
  body('deactived').isBoolean().withMessage('deactived must be a valid'),
  body('name')
    .isString()
    .withMessage('name must be a valid')
    .optional()
    .custom((value, { req }) => {
      const { isUploader, isAdmin } = req.body;
      if ((isUploader || isAdmin) && value) return true;
      if (!isUploader && !isAdmin) return true;
      return false;
    }),
];
