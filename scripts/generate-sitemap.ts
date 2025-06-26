import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

interface SitemapUrl {
  url: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

async function generateSitemap() {
  const hostname = 'https://elitepos.chat';
  const sitemapPath = resolve(process.cwd(), 'public', 'sitemap.xml');
  
  // Define your site's URLs with SEO priorities
  const urls: SitemapUrl[] = [
    // Homepage - Highest priority
    {
      url: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString()
    },
    
    // Main product pages
    {
      url: '/features',
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      url: '/pricing',
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      url: '/demo',
      changefreq: 'weekly',
      priority: 0.8
    },
    
    // Menu and ordering pages
    {
      url: '/menu',
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: '/menu/appetizers',
      changefreq: 'daily',
      priority: 0.7
    },
    {
      url: '/menu/entrees',
      changefreq: 'daily',
      priority: 0.7
    },
    {
      url: '/menu/desserts',
      changefreq: 'daily',
      priority: 0.7
    },
    {
      url: '/menu/beverages',
      changefreq: 'daily',
      priority: 0.7
    },
    
    // Information pages
    {
      url: '/about',
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      url: '/contact',
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      url: '/locations',
      changefreq: 'weekly',
      priority: 0.7
    },
    
    // Support and help
    {
      url: '/help',
      changefreq: 'weekly',
      priority: 0.6
    },
    {
      url: '/faq',
      changefreq: 'weekly',
      priority: 0.6
    },
    {
      url: '/support',
      changefreq: 'weekly',
      priority: 0.5
    },
    
    // Legal pages
    {
      url: '/privacy',
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      url: '/terms',
      changefreq: 'yearly',
      priority: 0.3
    },
    
    // Blog/News (if applicable)
    {
      url: '/blog',
      changefreq: 'weekly',
      priority: 0.7
    },
    
    // User-related pages
    {
      url: '/login',
      changefreq: 'never',
      priority: 0.2
    },
    {
      url: '/register',
      changefreq: 'never',
      priority: 0.2
    }
  ];

  try {
    const sitemap = new SitemapStream({ hostname });
    const writeStream = createWriteStream(sitemapPath);
    
    sitemap.pipe(writeStream);
    
    // Add all URLs to sitemap
    urls.forEach(url => {
      sitemap.write(url);
    });
    
    sitemap.end();
    
    await streamToPromise(sitemap);
    
    console.log('✅ Sitemap generated successfully at:', sitemapPath);
    console.log(`📊 Generated ${urls.length} URLs`);
    
    // Generate robots.txt
    await generateRobotsTxt();
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

async function generateRobotsTxt() {
  const robotsPath = resolve(process.cwd(), 'public', 'robots.txt');
  const robotsContent = `# Robots.txt for ElitePos
# Generated on ${new Date().toISOString()}

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /private/
Disallow: /temp/
Disallow: /*.json$
Disallow: /*?*

# Allow important files
Allow: /api/sitemap
Allow: /api/robots

# Sitemap location
Sitemap: https://elitepos.chat/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1

# Specific bot instructions
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /
`;

  try {
    const fs = await import('fs/promises');
    await fs.writeFile(robotsPath, robotsContent);
    console.log('✅ Robots.txt generated successfully at:', robotsPath);
  } catch (error) {
    console.error('❌ Error generating robots.txt:', error);
  }
}

// Run the script
if (require.main === module) {
  generateSitemap();
}

export { generateSitemap };
