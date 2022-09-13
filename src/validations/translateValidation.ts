import { body } from 'express-validator';

export const translateValidation = [
  body('sourceLanguageCode')
    .isString()
    .withMessage('sourceLanguageCode must be a valid'),
  body('targetLanguageCode')
    .isString()
    .withMessage('targetLanguageCode must be a valid'),
  body('images').isArray().withMessage('texts must be a valid'),
];
