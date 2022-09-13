import { NextFunction, Request, Response } from 'express';
import Api500Error from '../errors/api500Error';
import {
  DiscordAttachment,
  uploadFile as discordUpload,
} from '../utils/discord';
import chunk from 'lodash/chunk';
import supabase from '../lib/supabase';
import axios from 'axios';
import { LanguagesDetectFormat, multilangStatusCons } from '../types/anilist';

const DETECT_API_URL = process.env.MANGATO_DETECT_API;

const fileUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let imagesId: any;
  let modifiedFiles: DiscordAttachment[];

  try {
    const { file } = req.files;
    const { ctx } = req.body;
    const { chapterSlug, isCreate, userId } = JSON.parse(req?.body?.data);

    const chunkedFiles = chunk(Array.isArray(file) ? file : [file], 10);

    const chunkUploadedFiles = await Promise.all<DiscordAttachment[]>(
      chunkedFiles.map((files) => discordUpload(files)),
    );

    const uploadedFiles = chunkUploadedFiles.flat();

    if (!uploadedFiles?.length) throw new Api500Error('Files uploaded failed');

    modifiedFiles = uploadedFiles;

    if (ctx) {
      const parsedCtx = JSON.parse(ctx);

      if (Array.isArray(parsedCtx)) {
        modifiedFiles = uploadedFiles.map((file, index) => ({
          ...file,
          ctx: parsedCtx[index],
        }));
      } else {
        modifiedFiles = uploadedFiles.map((file) => ({
          ...file,
          ctx: parsedCtx,
        }));
      }
    }

    if (isCreate) {
      const { data }: any = await supabase
        .from('kaguya_images')
        .insert({
          chapterId: chapterSlug,
          images: modifiedFiles,
          userId,
        })
        .select('id')
        .single();

      imagesId = data.id;
      await supabase.from('images_detected').insert({ imagesId });
    } else {
      const { data } = await supabase
        .from('kaguya_images')
        .update({
          images: modifiedFiles,
        })
        .match({ chapterId: chapterSlug })
        .select()
        .single();

      imagesId = data.id;
    }

    res.status(200).json({
      success: true,
      files: modifiedFiles,
    });
  } catch (err) {
    next(err);
  }

  try {
    detect({
      images: modifiedFiles,
      imagesId,
      body: JSON.parse(req?.body?.data),
    });
  } catch (error) {
    await supabase
      .from('kaguya_chapters')
      .update({
        language: LanguagesDetectFormat[req?.body?.data.lang],
        multilang: multilangStatusCons.error,
      })
      .match({ slug: req?.body?.data.chapterSlug });
  }
};

interface DetectParams {
  images: any;
  imagesId: any;
  body: any;
}

const detect = async ({
  images,
  imagesId,
  body: { chapterSlug, lang },
}: DetectParams) => {
  await supabase
    .from('kaguya_chapters')
    .update({
      multilang: multilangStatusCons.processing,
    })
    .match({ slug: chapterSlug });

  const response = await axios({
    method: 'GET',
    url: DETECT_API_URL,
    data: {
      images: images.map(
        (e) => `https://media.discordapp.net/attachments/${e.proxy_url}`,
      ),
      lang,
    },
  });

  const nomalizeImage = response.data.images.map((image) => {
    return {
      ...image,
      url: image.url.split('https://media.discordapp.net/attachments/')[1],
    };
  });

  await Promise.all([
    supabase
      .from('images_detected')
      .update({
        additionData: nomalizeImage,
      })
      .eq('imagesId', imagesId),
    supabase
      .from('kaguya_chapters')
      .update({
        language: LanguagesDetectFormat[lang],
        multilang: multilangStatusCons.ready,
      })
      .match({ slug: chapterSlug }),
  ]);
};

export default fileUploadController;
