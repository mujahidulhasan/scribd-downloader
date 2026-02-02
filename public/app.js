async function handleDownload() {
    const url = document.getElementById('scribdUrl').value;
    const dlBtn = document.getElementById('dlBtn');
    const statusText = document.getElementById('status-text');
    const barFill = document.getElementById('bar-fill');
    const progressContainer = document.getElementById('progress-container');

    if (!url) return alert("URL দিন!");

    dlBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    statusText.innerText = "সার্ভার থেকে সব পেজের লিঙ্ক আনা হচ্ছে...";

    try {
        const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        const total = data.pages.length;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 0; i < total; i++) {
            const progress = Math.round(((i + 1) / total) * 100);
            barFill.style.width = progress + '%';
            statusText.innerText = `পেজ প্রসেস হচ্ছে: ${i + 1} / ${total}`;

            const img = new Image();
            img.src = `/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // কোনো ইমেজ মিস হলে স্কিপ করবে
                setTimeout(resolve, 10000); // ১০ সেকেন্ড ওয়েট
            });

            if (img.complete && img.naturalWidth > 0) {
                if (i > 0) pdf.addPage();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
            }
        }

        pdf.save(`Scribd_Document_${data.docId}.pdf`);
        statusText.innerText = "ডাউনলোড সম্পন্ন হয়েছে!";
    } catch (err) {
        statusText.innerText = "ভুল: " + err.message;
    } finally {
        dlBtn.disabled = false;
    }
}
