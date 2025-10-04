import { MCPServer } from '@modelcontextprotocol/sdk';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

const server = new MCPServer({
  name: 'webscraper-server',
  version: '1.0.0'
});

let browser;

server.on('initialize', async () => {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
});

server.addTool({
  name: 'scrape_webpage',
  description: 'Scrape content from a webpage',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      selector: { type: 'string', optional: true },
      waitFor: { type: 'number', optional: true }
    },
    required: ['url']
  },
  handler: async ({ url, selector, waitFor = 0 }) => {
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      if (waitFor > 0) await page.waitForTimeout(waitFor);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      if (selector) {
        const elements = $(selector).map((i, el) => $(el).text()).get();
        return { data: elements };
      }
      
      return {
        title: $('title').text(),
        body: $('body').text().substring(0, 5000),
        links: $('a').map((i, el) => $(el).attr('href')).get()
      };
    } finally {
      await page.close();
    }
  }
});

server.start();