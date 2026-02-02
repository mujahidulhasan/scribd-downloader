const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ১. ডকুমেন্ট ইনফো এবং ইমেজ লিংক জেনারেটর
app.post('/api/fetch', async (req, res) => {
    const { url } = req.body;
    const docId = url.match(/\/document\/(\d+)/)?.[1];

    if (!docId) return res.status(400).json({ error: "সঠিক Scribd লিংক দিন" });

    try {
        const embedUrl = `https://www.scribd.com/embeds/${docId}/content`;
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // অরিজিনাল কোয়ালিটি ইমেজ এক্সট্রাকশন
        const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        const pages = [...new Set(response.data.match(imgRegex))];

        if (pages.length === 0) throw new Error("No pages found");

        res.json({ success: true, docId, pages });
    } catch (error) {
        res.status(500).json({ error: "Scribd access blocked. Try again later." });
    }
});

// ২. ইমেজ প্রক্সি (অন্য সাইটগুলোর মতো কাজ করবে)
app.get('/api/proxy', async (req, res) => {
    const { img } = req.query;
    try {
        const response = await axios.get(img, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
