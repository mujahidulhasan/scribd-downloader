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
        // Scribd এর মেইন পেজ থেকে ডেটা খোঁজা
        const response = await axios.get(`https://www.scribd.com/document/${docId}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html'
            }
        });

        const html = response.data;
        
        // সব পেজের অরিজিনাল ইমেজ লিঙ্ক বের করার সবচেয়ে শক্তিশালী প্যাটার্ন
        // এটি স্ক্রিবড এর ইন্টারনাল JSON ডাটা থেকেও লিঙ্ক খুঁজে বের করে
        const imgRegex = /https:\/\/imgv2-[^"]+scribdassets.com\/img\/document\/[^"]+\/original\/[^"]+/g;
        let pages = [...new Set(html.match(imgRegex))];

        // যদি ১টি পেজ পায়, তবে এমবেড ভার্সন থেকে ট্রাই করবে
        if (pages.length <= 1) {
            const embedRes = await axios.get(`https://www.scribd.com/embeds/${docId}/content`);
            const embedPages = [...new Set(embedRes.data.match(imgRegex))];
            if (embedPages.length > pages.length) pages = embedPages;
        }

        // পেজগুলোকে সঠিক সিরিয়ালে সাজানো (অত্যন্ত জরুরি)
        pages = pages.sort((a, b) => {
            const numA = parseInt(a.match(/\/original\/([a-z0-9]+)/)?.[1], 16) || 0;
            const numB = parseInt(b.match(/\/original\/([a-z0-9]+)/)?.[1], 16) || 0;
            return numA - numB;
        });

        if (pages.length === 0) throw new Error("কোন পেজ পাওয়া যায়নি। এটি একটি প্রটেক্টেড ফাইল হতে পারে।");

        res.json({ success: true, pages, docId, total: pages.length });
    } catch (error) {
        res.status(500).json({ error: "Scribd ডেটা নিতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" });
    }
});

// ইমেজ প্রক্সি (CORS সমস্যা এড়াতে)
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
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
