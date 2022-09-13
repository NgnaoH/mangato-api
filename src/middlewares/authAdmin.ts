import { NextFunction, Request, Response } from 'express';
import supabase from '../lib/supabase';

const authAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) return res.sendStatus(401);

  const data: any = await supabase
    .from('users')
    .select('authRole')
    .eq('id', user.id)
    .single();

  if (data.authRole === 'user') return res.sendStatus(401);

  next();
};

export default authAdmin;
