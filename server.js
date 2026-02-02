const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/fetch-scribd', async (req, res) => {
    const { url } = req.body;
    const docId = url.match(/\/document\/(\d+)/)?.[1];

    if (!docId) return res.status(400).json({ error: "সঠিক Scribd URL দিন" });

    try {
        const embedUrl = `https://www.scribd.com/embeds/${docId}/content`;
        const response = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        // ইমেজ লিংক এক্সট্রাকশন
        const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        const pages = [...new Set(response.data.match(imgRegex))];

        if (pages.length === 0) throw new Error("কোন পেজ পাওয়া যায়নি");
        res.json({ success: true, pages });
    } catch (error) {
        res.status(500).json({ error: "ডেটা ফেচ করতে সমস্যা হয়েছে। লিংকটি চেক করুন।" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`সার্ভার চলছে: http://localhost:${PORT}`));
