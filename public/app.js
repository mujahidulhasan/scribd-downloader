async function handleDownload() {
    const url = document.getElementById('scribdUrl').value;
    const dlBtn = document.getElementById('dlBtn');
    const statusText = document.getElementById('status-text');
    const barFill = document.getElementById('bar-fill');

    if (!url) return alert("লিঙ্ক দিন!");

    dlBtn.disabled = true;
    document.getElementById('progress-container').classList.remove('hidden');
    statusText.innerText = "সার্ভার থেকে ৫০+ পেজের লিঙ্ক খোঁজা হচ্ছে...";

    try {
        const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        const total = data.pages.length;
        statusText.innerText = `মোট ${total} টি পেজ পাওয়া গেছে। প্রসেসিং শুরু হচ্ছে...`;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 0; i < total; i++) {
            // প্রোগ্রেস আপডেট
            const progress = Math.round(((i + 1) / total) * 100);
            barFill.style.width = progress + '%';
            statusText.innerText = `পেজ প্রসেস হচ্ছে: ${i + 1} / ${total}`;

            const img = new Image();
            img.src = `/api/proxy?imgUrl=${encodeURIComponent(data.pages[i])}`;
            img.crossOrigin = "anonymous";

            // ইমেজ লোড হওয়া পর্যন্ত অপেক্ষা
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // কোনো পেজ এরর দিলে স্কিপ করবে
                setTimeout(resolve, 10000); // ১০ সেকেন্ড টাইমআউট
            });

            if (img.complete && img.naturalWidth > 0) {
                if (i > 0) pdf.addPage();
                pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
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
