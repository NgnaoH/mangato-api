import { NextFunction, Request, Response } from 'express';
import { isEmpty } from 'lodash';
import Api400Error from '../errors/api400Error';
import Api500Error from '../errors/api500Error';
import supabase from '../lib/supabase';

const userController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isUploader, isAdmin, deactived, userId, name } = req.body;

    const [{ data: user }, { data: userSource }, { count: countSource }] =
      await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase
          .from('kaguya_sources')
          .select('*')
          .eq('addedUserId', userId)
          .single(),
        supabase.from('kaguya_sources').select('id', { count: 'exact' }),
      ]);

    if (isEmpty(user)) {
      throw new Api400Error('Unknown user id');
    }

    const userUpdated = {
      deactived: !!deactived,
      authRole: isAdmin ? 'admin' : 'user',
      isVerified: Boolean(isUploader || isAdmin),
      updated_at: new Date().toISOString().toLocaleString(),
    };

    if (deactived || (!isEmpty(userSource) && !isUploader && !isAdmin)) {
      userUpdated.isVerified = false;
    }

    if (isEmpty(userSource) && (isAdmin || isUploader)) {
      const { error } = await supabase.from('kaguya_sources').insert({
        id: countSource + 1,
        name,
        addedUserId: userId,
        isCustomSource: true,
      });

      if (error) throw new Api500Error(error.message);
    }

    if (!isEmpty(name)) {
      const { error } = await supabase
        .from('kaguya_sources')
        .update({
          name,
        })
        .eq('id', userSource?.id ? userSource.id : countSource + 1);

      if (error) throw new Api500Error(error.message);
    }

    const { error } = await supabase
      .from('users')
      .update(userUpdated)
      .match({ id: userId });

    if (error) throw new Api500Error(error.message);

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    next(err);
  }
};

export default userController;
