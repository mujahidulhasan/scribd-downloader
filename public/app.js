async function startDownload() {
    const url = document.getElementById('url').value;
    const status = document.getElementById('status');
    
    status.innerHTML = "🔍 স্ক্রিবড থেকে ডেটা আনা হচ্ছে...";

    try {
        const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        for (let i = 0; i < data.pages.length; i++) {
            status.innerHTML = `⏳ পেজ প্রসেসিং হচ্ছে: ${i + 1} / ${data.pages.length}`;
            
            const img = new Image();
            // আমরা সরাসরি আমাদের প্রক্সি এপিআই ব্যবহার করছি
            img.src = `/api/proxy?img=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            await new Promise(resolve => img.onload = resolve);

            if (i > 0) pdf.addPage();
            pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(`Scribd_Downloader_${data.docId}.pdf`);
        status.innerHTML = "✅ ডাউনলোড সফল হয়েছে!";
    } catch (err) {
        status.innerHTML = "❌ ভুল: " + err.message;
    }
}
