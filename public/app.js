async function startDownload() {
    const urlInput = document.getElementById('url');
    const status = document.getElementById('status');
    const btn = document.querySelector('button');

    if (!urlInput.value) return alert("URL দিন!");

    btn.disabled = true;
    status.innerText = "সার্ভার থেকে ডেটা আনা হচ্ছে...";

    try {
        const response = await fetch('/get-source', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlInput.value })
        });
        const data = await response.json();

        if (data.success) {
            status.innerText = "PDF তৈরি হচ্ছে... (অপেক্ষা করুন)";
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            for (let i = 0; i < data.pages.length; i++) {
                const img = new Image();
                img.src = data.pages[i];
                img.crossOrigin = "anonymous";
                await new Promise(r => img.onload = r);

                if (i > 0) pdf.addPage();
                pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
                status.innerText = `প্রসেসিং: ${Math.round(((i + 1) / data.pages.length) * 100)}%`;
            }

            pdf.save('Document.pdf');
            status.innerText = "ডাউনলোড সম্পন্ন!";
        } else {
            status.innerText = "ত্রুটি: " + data.error;
        }
    } catch (err) {
        status.innerText = "সার্ভারে কানেক্ট করা যাচ্ছে না।";
    } finally {
        btn.disabled = false;
    }
}
