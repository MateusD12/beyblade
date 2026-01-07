import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const size = parseInt(url.searchParams.get('size') || '400');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400, headers: corsHeaders });
    }

    const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheKey = `wiki-cache/${sanitizedSlug}-${size}.jpg`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to serve from storage cache first
    const { data: cachedFile } = await supabase.storage
      .from('beyblade-photos')
      .download(cacheKey);

    if (cachedFile) {
      console.log(`Serving cached image for ${slug}`);
      const arrayBuffer = await cachedFile.arrayBuffer();
      return new Response(arrayBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Not cached - fetch from Fandom API
    console.log(`Fetching image from Fandom for ${slug}`);
    
    const apiUrl = `https://beyblade.fandom.com/api.php?action=query&titles=${encodeURIComponent(slug)}&prop=pageimages&pithumbsize=${size}&format=json&redirects=1`;
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      console.error(`Fandom API error: ${apiResponse.status}`);
      return new Response('Failed to fetch from wiki', { status: 404, headers: corsHeaders });
    }

    const apiData = await apiResponse.json();
    const pages = apiData.query?.pages;
    
    if (!pages) {
      return new Response('No pages found', { status: 404, headers: corsHeaders });
    }

    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId]?.thumbnail?.source;

    if (!imageUrl) {
      console.log(`No image found for ${slug}`);
      return new Response('No image available', { status: 404, headers: corsHeaders });
    }

    console.log(`Downloading image from: ${imageUrl}`);

    // Download the image with browser-like headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://beyblade.fandom.com/',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Image download failed: ${imageResponse.status}`);
      return new Response('Failed to download image', { status: 404, headers: corsHeaders });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Cache in storage (fire and forget)
    supabase.storage
      .from('beyblade-photos')
      .upload(cacheKey, imageBuffer, {
        contentType,
        upsert: true,
      })
      .then(({ error }) => {
        if (error) {
          console.error(`Failed to cache image: ${error.message}`);
        } else {
          console.log(`Cached image for ${slug}`);
        }
      });

    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });

  } catch (error) {
    console.error('Error in beyblade-image:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
