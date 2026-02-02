import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/fetch', async (req, res) => {
    const { url } = req.body;
    const docId = url.match(/\d+/)?.[0];

    if (!docId) return res.status(400).json({ error: "সঠিক লিঙ্ক দিন" });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // এম্বেড লিঙ্ক তৈরি করা (আপনার শেয়ার করা কোড অনুযায়ী)
        const embedUrl = `https://www.scribd.com/embeds/${docId}/content`;
        await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // অটো-স্ক্রলিং লজিক: এটি ৫০+ পেজ লোড নিশ্চিত করবে
        await page.evaluate(async () => {
            const scroller = document.querySelector('.document_scroller') || document.documentElement;
            let lastHeight = scroller.scrollHeight;
            while (true) {
                window.scrollBy(0, 800);
                await new Promise(r => setTimeout(r, 500));
                let newHeight = scroller.scrollHeight;
                if (newHeight === lastHeight) break;
                lastHeight = newHeight;
            }
        });

        // সব পেজের ইমেজ লিঙ্ক সংগ্রহ করা
        const pages = await page.evaluate(() => {
            const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
            return [...new Set(document.documentElement.innerHTML.match(imgRegex))].sort();
        });

        await browser.close();
        res.json({ success: true, pages, docId });

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
});

// ইমেজ প্রক্সি (CORS বাইপাস করার জন্য)
app.get('/api/proxy', async (req, res) => {
    const { imgUrl } = req.query;
    try {
        const fetchRes = await fetch(imgUrl);
        const buffer = await fetchRes.arrayBuffer();
        res.set('Content-Type', 'image/jpeg');
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send('Proxy error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
