import MangaScraper, {
  GetImagesData,
  GetImagesQuery,
} from '../../core/MangaScraper';
import supabase from '../../lib/supabase';

// Custom scraper for user uploading
export default class MangaCustomScraper extends MangaScraper {
  constructor() {
    super('custom', 'Custom', { baseURL: '' });

    this.disableMonitor = true;
  }

  async getImages(query: GetImagesQuery): Promise<GetImagesData> {
    const { chapter_id, source_id } = query;

    const { data, error } = await supabase
      .from('kaguya_images')
      .select('images, id')
      .eq('chapterId', `${source_id}-${chapter_id}`)
      .single();

    if (!data?.images?.length || error) {
      return {
        images: [],
        imagesId: null,
      };
    }

    return {
      images: data.images.map((image) => ({
        ...image,
        image: 'https://media.discordapp.net/attachments/' + image.proxy_url,
        useProxy: false,
      })),
      imagesId: data.id,
    };
  }
}
