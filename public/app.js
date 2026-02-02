async function handleDownload() {
    const url = document.getElementById('scribdUrl').value;
    const dlBtn = document.getElementById('dlBtn');
    const progressSection = document.getElementById('progress-section');
    const barFill = document.getElementById('bar-fill');
    const statusText = document.getElementById('status-text');

    if (!url) return alert("লিঙ্ক দিন!");

    dlBtn.disabled = true;
    progressSection.classList.remove('hidden');
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
        const pdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 0; i < data.pages.length; i++) {
            const progress = Math.round(((i + 1) / data.pages.length) * 100);
            barFill.style.width = progress + '%';
            statusText.innerText = `পেজ প্রসেসিং: ${i + 1} / ${data.pages.length}`;

            const img = new Image();
            img.src = `/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Skip failed image
                setTimeout(resolve, 8000); // Timeout for slow mobile network
            });

            if (img.complete && img.naturalWidth !== 0) {
                if (i > 0) pdf.addPage();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
            }
        }

        pdf.save(`Scribd_${data.docId}.pdf`);
        statusText.innerText = "ডাউনলোড সফল হয়েছে!";
    } catch (err) {
        statusText.innerText = "ভুল: " + err.message;
    } finally {
        dlBtn.disabled = false;
    }
}
