async function handleDownload() {
    const url = document.getElementById('scribdUrl').value;
    const dlBtn = document.getElementById('dlBtn');
    const statusText = document.getElementById('status-text');
    const barFill = document.getElementById('bar-fill');
    const progressSection = document.getElementById('progress-section');

    if (!url) return alert("URL দিন!");

    dlBtn.disabled = true;
    progressSection.classList.remove('hidden');
    statusText.innerText = "সার্ভার থেকে ৫০+ পেজের লিঙ্ক খোঁজা হচ্ছে...";

    try {
        const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        const totalPages = data.pages.length;
        statusText.innerText = `মোট ${totalPages} টি পেজ পাওয়া গেছে। প্রসেসিং শুরু হচ্ছে...`;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // প্রতিটি ইমেজ লোড এবং পিডিএফ-এ যুক্ত করা
        for (let i = 0; i < totalPages; i++) {
            const progress = Math.round(((i + 1) / totalPages) * 100);
            barFill.style.width = progress + '%';
            statusText.innerText = `পেজ কনভার্ট হচ্ছে: ${i + 1} / ${totalPages}`;

            const img = new Image();
            img.src = `/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // কোনো পেজ এরর হলে সেটি স্কিপ করবে
                setTimeout(resolve, 10000); // ১০ সেকেন্ড টাইমআউট
            });

            if (img.complete && img.naturalWidth > 0) {
                if (i > 0) pdf.addPage();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
            }
        }

        pdf.save(`Scribd_Document_${data.docId}.pdf`);
        statusText.innerText = "ডাউনলোড সফল হয়েছে!";
    } catch (err) {
        statusText.innerText = "ভুল: " + err.message;
    } finally {
        dlBtn.disabled = false;
    }
}
