const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ১. Scribd থেকে ইমেজের লিঙ্ক বের করা
app.post('/api/fetch', async (req, res) => {
    const { url } = req.body;
    const docId = url.match(/\/document\/(\d+)/)?.[1];

    if (!docId) return res.status(400).json({ error: "সঠিক Scribd লিঙ্ক দিন (যেমন: scribd.com/document/123...)" });

    try {
        const embedUrl = `https://www.scribd.com/embeds/${docId}/content`;
        const response = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        const pages = [...new Set(response.data.match(imgRegex))];

        if (pages.length === 0) return res.status(404).json({ error: "কোন পেজ পাওয়া যায়নি। ডকুমেন্টটি হয়তো প্রাইভেট।" });

        res.json({ success: true, pages, docId });
    } catch (error) {
        res.status(500).json({ error: "Scribd-এ অ্যাক্সেস করা যাচ্ছে না।" });
    }
});

// ২. ইমেজ প্রক্সি (CORS সমস্যা সমাধানের জন্য)
app.get('/api/proxy', async (req, res) => {
    const { imgUrl } = req.query;
    try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.status(500).send('Proxy Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
