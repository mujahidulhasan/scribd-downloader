const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/fetch', async (req, res) => {
    const { url } = req.body;
    const docId = url.match(/\/document\/(\d+)/)?.[1];

    if (!docId) return res.status(400).json({ error: "সঠিক Scribd লিঙ্ক দিন" });

    try {
        // Scribd-এর মেইন পেজ থেকে ডেটা খোঁজা
        const { data } = await axios.get(`https://www.scribd.com/document/${docId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        // সব পেজের অরিজিনাল ইমেজ লিঙ্ক বের করার প্যাটার্ন
        const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        let pages = [...new Set(data.match(imgRegex))];

        if (pages.length <= 1) {
            // যদি মেইন পেজে না পায়, তবে এমবেড পেজ ট্রাই করবে
            const embed = await axios.get(`https://www.scribd.com/embeds/${docId}/content`);
            pages = [...new Set(embed.data.match(imgRegex))];
        }

        pages.sort(); // পেজগুলো ক্রমানুসারে সাজানো
        res.json({ success: true, pages, docId });
    } catch (error) {
        res.status(500).json({ error: "Scribd থেকে ডেটা নেওয়া যাচ্ছে না।" });
    }
});

app.get('/api/proxy', async (req, res) => {
    const { imgUrl } = req.query;
    try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
