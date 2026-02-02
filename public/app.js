async function handleDownload() {
    const url = document.getElementById('scribdUrl').value;
    const statusText = document.getElementById('status-text');
    const barFill = document.getElementById('bar-fill');
    
    if(!url) return alert("লিঙ্ক দিন!");

    document.getElementById('progress-container').style.display = 'block';
    statusText.innerText = "🔍 স্ক্রলিং এবং পেজ ডিটেকশন চলছে (১-২ মিনিট লাগতে পারে)...";

    try {
        const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const total = data.pages.length;

        for (let i = 0; i < total; i++) {
            statusText.innerText = `📄 পেজ কনভার্ট হচ্ছে: ${i + 1} / ${total}`;
            barFill.style.width = `${((i + 1) / total) * 100}%`;

            const imgResp = await fetch(`/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`);
            const imgBytes = await imgResp.arrayBuffer();
            const img = await pdfDoc.embedJpg(imgBytes);
            
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Scribd_Document_${data.docId}.pdf`;
        link.click();
        
        statusText.innerText = "✅ ডাউনলোড সফল হয়েছে!";
    } catch (err) {
        statusText.innerText = "❌ ভুল: " + err.message;
    }
}
