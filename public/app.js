async function startDownload() {
    const url = document.getElementById('scribdUrl').value;
    const statusBox = document.getElementById('status-box');
    const statusText = document.getElementById('status-text');
    const dlBtn = document.getElementById('dlBtn');

    if (!url) return alert("অনুগ্রহ করে লিঙ্ক দিন!");

    dlBtn.disabled = true;
    statusBox.style.display = 'block';
    statusText.innerText = "সার্ভার থেকে ডেটা সংগ্রহ করা হচ্ছে...";

    try {
        const response = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        for (let i = 0; i < data.pages.length; i++) {
            statusText.innerText = `পেজ প্রসেসিং: ${i + 1} / ${data.pages.length}`;
            
            const img = new Image();
            // ইমেজ প্রক্সি ইউআরএল ব্যবহার
            img.src = `/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            await new Promise(resolve => img.onload = resolve);

            if (i > 0) pdf.addPage();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
        }

        pdf.save(`Scribd_Downloader_${data.docId}.pdf`);
        statusText.innerText = "ডাউনলোড সফল হয়েছে!";
    } catch (err) {
        statusText.innerText = "ভুল: " + err.message;
    } finally {
        dlBtn.disabled = false;
    }
}
