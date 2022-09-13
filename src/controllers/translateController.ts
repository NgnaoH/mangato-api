import { Request, Response } from 'express';
import {
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate';
import { cloneDeep } from 'lodash';

const client = new TranslateClient({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

type Body = {
  sourceLanguageCode: string;
  targetLanguageCode: string;
  images: Array<any>;
};

const removeEscapeSequences = (text = '') => {
  return text
    .split('-\n')
    .join('')
    .split('\n')
    .join(' ')
    .split('\f')
    .join('')
    .trim();
};

const translateController = async (
  req: Request,
  res: Response,
  // _next: NextFunction,
) => {
  const { sourceLanguageCode, targetLanguageCode, images } = req.body as Body;
  const imagesCloned = cloneDeep(images);
  try {
    for (let idxImg = 0; idxImg < imagesCloned.length; idxImg++) {
      for (
        let idxBox = 0;
        idxBox < imagesCloned[idxImg]?.boxes.length;
        idxBox++
      ) {
        const text = removeEscapeSequences(
          imagesCloned[idxImg].boxes[idxBox].text,
        );
        if (text.length) {
          const params = {
            Text: text,
            SourceLanguageCode: sourceLanguageCode,
            TargetLanguageCode: targetLanguageCode,
          };
          const command = new TranslateTextCommand(params);
          const response = await client.send(command);
          imagesCloned[idxImg].boxes[idxBox].text = response.TranslatedText;
        }
      }
    }

    res.status(200).json({
      success: true,
      images: imagesCloned,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export default translateController;
