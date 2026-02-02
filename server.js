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

    if (!docId) return res.status(400).json({ error: "সঠিক লিঙ্ক দিন" });

    try {
        // ১. মেইন পেজ থেকে ডেটা খোঁজা
        const mainPage = await axios.get(`https://www.scribd.com/document/${docId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        // ২. সব পেজের লিঙ্ক বের করার জন্য গ্লোবাল রেগুলার এক্সপ্রেশন
        // এটি সোর্স কোডে থাকা সব অরিজিনাল ইমেজ ইউআরএল খুঁজে বের করবে
        const imgPattern = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        let pages = [...new Set(mainPage.data.match(imgPattern))];

        // ৩. যদি ১টি পেজ আসে, তবে এমবেড ভার্সন থেকে ট্রাই করা
        if (pages.length <= 1) {
            const embedRes = await axios.get(`https://www.scribd.com/embeds/${docId}/content`);
            const embedPages = [...new Set(embedRes.data.match(imgPattern))];
            if (embedPages.length > pages.length) pages = embedPages;
        }

        // ৪. পেজগুলোকে ক্রমানুসারে সাজানো (অত্যন্ত জরুরি)
        pages.sort();

        if (pages.length === 0) throw new Error("কোন পেজ পাওয়া যায়নি।");

        res.json({ success: true, pages, docId, count: pages.length });
    } catch (error) {
        res.status(500).json({ error: "Scribd ডেটা নিতে ব্যর্থ হয়েছে।" });
    }
});

app.get('/api/proxy', async (req, res) => {
    const { imgUrl } = req.query;
    try {
        const response = await axios.get(imgUrl, { 
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.status(500).send('Proxy Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
