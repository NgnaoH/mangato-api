import apicache from 'apicache';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';

import animeEpisodeController from './controllers/animeEpisodeController';
import fileUploadController from './controllers/fileUploadController';
import imageSourceController from './controllers/imageSourceController';
import videoRemoteStatusController from './controllers/videoRemoteStatusController';
import videoRemoteUploadController from './controllers/videoRemoteUploadController';
import videoSourceController from './controllers/videoSourceController';
import videoStatusController from './controllers/videoStatusController';

import auth from './middlewares/auth';
import checkUploadPermission from './middlewares/checkUploadPermission';
import validate from './middlewares/validate';

import fileProxyController from './controllers/fileProxyController';
import mangaChapterController from './controllers/mangaChapterController';
import { fileProxyValidation } from './validations/fileProxyValidation';
import { fileUploadValidation } from './validations/fileUploadValidation';
import { uploadChapterValidation } from './validations/uploadChapterValidation';
import { uploadEpisodeValidation } from './validations/uploadEpisodeValidation';
import { videoRemoteStatusValidation } from './validations/videoRemoteStatusValidation';
import { videoRemoteUploadValidation } from './validations/videoRemoteUploadValidation';
import { videoStatusValidation } from './validations/videoStatusValidation';
import translateController from './controllers/translateController';
import { translateValidation } from './validations/translateValidation';
import { userValidation } from './validations/userValidation';
import userController from './controllers/userController';
import authAdmin from './middlewares/authAdmin';
interface RequestCustom extends Request {
  apicacheGroup: string;
}

const cache = apicache.middleware;

const successCache = (duration: string) => cache(duration);

const router = express.Router();

router.get('/', (_, res) => {
  res.send('Working yo');
});

router.get(
  '/images',
  successCache('5 minutes'),
  (req: RequestCustom, _res: Response, next: NextFunction) => {
    const { source_id, chapter_id } = req.query;
    req.apicacheGroup = `images-${source_id}-${chapter_id}`;
    next();
  },
  imageSourceController,
);

router.get('/source', successCache('30 minutes'), videoSourceController);

router.get(
  '/upload/video/:hostingId/:fileId/status',
  validate(videoStatusValidation),
  auth,
  checkUploadPermission,
  videoStatusController,
);

router.post(
  '/upload/video/:hostingId/remote',
  validate(videoRemoteUploadValidation),
  auth,
  checkUploadPermission,
  videoRemoteUploadController,
);

router.get(
  '/upload/video/:hostingId/remote/:remoteId/status',
  validate(videoRemoteStatusValidation),
  auth,
  checkUploadPermission,
  videoRemoteStatusController,
);

router.post(
  '/upload/file',
  validate(fileUploadValidation),
  auth,
  checkUploadPermission,
  fileUploadController,
);

router.post(
  '/upload/episodes/:mediaId',
  validate(uploadEpisodeValidation),
  auth,
  checkUploadPermission,
  animeEpisodeController,
);

router.post(
  '/upload/chapters/:mediaId',
  validate(uploadChapterValidation),
  auth,
  checkUploadPermission,
  mangaChapterController,
);

router.get(
  '/file/:id1/:id2/:filename',
  validate(fileProxyValidation),
  fileProxyController,
);

router.post('/translate', validate(translateValidation), translateController);

router.get('/cache/performance', (_req, res) => {
  res.json(apicache.getPerformance());
});

router.get('/cache/index', (_req, res) => {
  res.json(apicache.getIndex());
});

router.get('/cache/clear', (req, res) => {
  const { source_id, chapter_id } = req.query;
  res.json(apicache.clear(`images-${source_id}-${chapter_id}`));
});

router.put('/user', validate(userValidation), authAdmin, userController);

export default router;
