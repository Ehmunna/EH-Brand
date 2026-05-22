// product-detail.js
// Loads a single product from Firestore based on ?code=XXX in the URL

let db = null;
let currentProduct = null;
let galleryImages = [];
let currentLbIndex = 0;

// ── Wait for Firebase ──────────────────────────────────────────────────────
window.addEventListener('firebaseReady', () => {
    if (window.firebaseDb) { db = window.firebaseDb; init(); }
});
setTimeout(() => {
    if (!db && window.firebaseDb) { db = window.firebaseDb; init(); }
    else if (!db) { initFirebaseDirectly(); }
}, 1200);

async function initFirebaseDirectly() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const cfg = {
            apiKey: "AIzaSyC2Bsd-HqfhhC8i5cQUF2ZmofUJaFIcvDs",
            authDomain: "lamim-754aa.firebaseapp.com",
            projectId: "lamim-754aa",
            storageBucket: "lamim-754aa.firebasestorage.app",
            messagingSenderId: "1087897423283",
            appId: "1:1087897423283:web:10a57c0acf8879fc1e4fc6"
        };
        const app = initializeApp(cfg);
        db = getFirestore(app);
        init();
    } catch (err) {
        console.error('Firebase init failed', err);
        showError();
    }
}

// ── Main init ──────────────────────────────────────────────────────────────
function init() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) { showError(); return; }
    loadProduct(code);
    setupMobileMenu();
}

// ── Load product from Firestore ────────────────────────────────────────────
async function loadProduct(code) {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const snap = await getDocs(collection(db, 'products'));
        let found = null;
        snap.forEach(doc => {
            const d = doc.data();
            if (d.productCode === code) found = d;
        });
        if (!found) { showError(); return; }
        currentProduct = found;
        renderProduct(found);
    } catch (err) {
        console.error('Error loading product:', err);
        showError();
    }
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderProduct(p) {
    document.title = `${p.name || 'Product'} - Style Gallery`;

    // Breadcrumb
    document.getElementById('breadcrumbName').textContent = p.name || 'Product';

    // Build image list: imageUrl first, then extra images array
    galleryImages = [];
    if (p.imageUrl) galleryImages.push(p.imageUrl);
    if (Array.isArray(p.images)) {
        p.images.forEach(img => { if (img && !galleryImages.includes(img)) galleryImages.push(img); });
    }
    if (galleryImages.length === 0) {
        galleryImages.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80');
    }

    // Main image
    const mainImg = document.getElementById('mainImage');
    mainImg.src = galleryImages[0];
    mainImg.alt = p.name;
    mainImg.onerror = () => { mainImg.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80'; };

    // Thumbnails
    const strip = document.getElementById('thumbnailStrip');
    strip.innerHTML = '';
    if (galleryImages.length > 1) {
        galleryImages.forEach((url, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumb' + (i === 0 ? ' active' : '');
            thumb.innerHTML = `<img src="${url}" alt="Image ${i+1}" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">`;
            thumb.addEventListener('click', () => switchImage(i));
            strip.appendChild(thumb);
        });
    }

    // Lightbox on main image click
    document.querySelector('.main-image-wrap').addEventListener('click', () => openLightbox(currentLbIndex));

    // Name
    document.getElementById('detailName').textContent = p.name || 'Product';

    // Price
    const discount = p.discount || 0;
    const origPrice = parseFloat(p.price) || 0;
    const discPrice = discount > 0 ? origPrice - (origPrice * discount / 100) : origPrice;
    document.getElementById('detailPriceRow').innerHTML = `
        <span class="current-price">TK ${discPrice.toFixed(2)}</span>
        ${discount > 0 ? `
            <span class="original-price">TK ${origPrice.toFixed(2)}</span>
            <span class="discount">${discount}% OFF</span>
        ` : ''}
    `;

    // Code
    document.getElementById('detailCode').textContent = p.productCode || 'N/A';

    // Description
    const descSection = document.getElementById('detailDescription');
    const descText = document.getElementById('descText');
    if (p.description && p.description.trim()) {
        descText.textContent = p.description;
        descSection.style.display = 'block';
    }

    // Order button
    const discP = p.discount > 0 ? (parseFloat(p.price) - parseFloat(p.price) * p.discount / 100) : parseFloat(p.price);
    document.getElementById('orderBtnDetail').addEventListener('click', () => openOrderModal(p.productCode, p.name, discP));

    // Share button
    document.getElementById('shareBtnDetail').addEventListener('click', () => shareProduct(p.productCode, p.name));

    // Show wrapper, hide loader
    document.getElementById('detailLoader').style.display = 'none';
    document.getElementById('detailWrapper').style.display = 'grid';
}

// ── Switch gallery image ───────────────────────────────────────────────────
function switchImage(index) {
    currentLbIndex = index;
    const mainImg = document.getElementById('mainImage');
    mainImg.style.opacity = '0';
    mainImg.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        mainImg.src = galleryImages[index];
        mainImg.style.opacity = '1';
    }, 200);

    document.querySelectorAll('.thumb').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

// ── Lightbox ───────────────────────────────────────────────────────────────
function openLightbox(index) {
    currentLbIndex = index;
    document.getElementById('lbImage').src = galleryImages[index];
    document.getElementById('lightbox').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = '';
}

function lbMove(dir) {
    currentLbIndex = (currentLbIndex + dir + galleryImages.length) % galleryImages.length;
    document.getElementById('lbImage').src = galleryImages[currentLbIndex];
    switchImage(currentLbIndex);
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => lbMove(-1));
document.getElementById('lbNext').addEventListener('click', () => lbMove(1));
document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
});
document.addEventListener('keydown', e => {
    if (document.getElementById('lightbox').style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lbMove(-1);
        if (e.key === 'ArrowRight') lbMove(1);
    }
});

// ── Order Modal ────────────────────────────────────────────────────────────
function openOrderModal(code, name, price) {
    window._currentOrderPrice = parseFloat(price) || 0;
    document.getElementById('productCode').value = code;
    document.getElementById('modalTitle').textContent = `Order: ${name}`;
    const qtyInput = document.getElementById('quantityInput');
    if (qtyInput) qtyInput.value = 1;
    updateOrderTotal();
    const modal = document.getElementById('orderModal');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { modal.style.opacity = '1'; }, 10);
    setTimeout(() => { document.getElementById('customerName').focus(); }, 300);
}

function updateOrderTotal() {
    const price = window._currentOrderPrice || 0;
    const qty = parseInt(document.getElementById('quantityInput')?.value) || 1;
    const subtotal = price * qty;
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    let delivery = 0;
    if (selected) {
        delivery = selected.value === 'custom'
            ? parseFloat(document.getElementById('deliveryCharge')?.value) || 0
            : parseFloat(selected.value) || 0;
    }
    const total = subtotal + delivery;
    const box = document.getElementById('totalPriceBox');
    if (box) {
        if (price > 0 || delivery > 0) {
            const subtotalEl = document.getElementById('subtotalDisplay');
            const deliveryEl = document.getElementById('deliveryDisplay');
            const totalEl = document.getElementById('totalPriceDisplay');
            if (subtotalEl) subtotalEl.textContent = `TK ${subtotal.toFixed(2)}`;
            if (deliveryEl) deliveryEl.textContent = `TK ${delivery.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `TK ${total.toFixed(2)}`;
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    }
}

// Quantity button listeners for detail page modal
document.addEventListener('click', function(e) {
    if (e.target.id === 'qtyMinus' || e.target.closest('#qtyMinus')) {
        const inp = document.getElementById('quantityInput');
        if (inp && parseInt(inp.value) > 1) { inp.value = parseInt(inp.value) - 1; updateOrderTotal(); }
    }
    if (e.target.id === 'qtyPlus' || e.target.closest('#qtyPlus')) {
        const inp = document.getElementById('quantityInput');
        if (inp) { inp.value = parseInt(inp.value) + 1; updateOrderTotal(); }
    }
});
document.addEventListener('input', function(e) {
    if (e.target.id === 'quantityInput' || e.target.id === 'deliveryCharge') updateOrderTotal();
});
document.addEventListener('change', function(e) {
    if (e.target.name === 'deliveryType') {
        const ci = document.getElementById('deliveryCharge');
        if (ci) { ci.style.display = e.target.value === 'custom' ? 'block' : 'none'; if (e.target.value !== 'custom') ci.value = ''; }
        updateOrderTotal();
    }
});

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; document.getElementById('orderForm').reset(); }, 300);
}

document.querySelector('.close-modal').addEventListener('click', closeModal);
window.addEventListener('click', e => { if (e.target === document.getElementById('orderModal')) closeModal(); });

document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const loc = document.getElementById('location').value.trim();
    const code = document.getElementById('productCode').value.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^(?:\+88|01)?\d{11}$/.test(cleanPhone)) {
        alert('সঠিক বাংলাদেশী নম্বর দিন (১১ সংখ্যা)');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const qty = parseInt(document.getElementById('quantityInput')?.value) || 1;
        const comment = document.getElementById('customerComment')?.value.trim() || '';
        const unitPrice = window._currentOrderPrice || 0;
        const subtotal = unitPrice * qty;
        const selDel = document.querySelector('input[name="deliveryType"]:checked');
        let deliveryCharge = 0;
        if (selDel) { deliveryCharge = selDel.value === 'custom' ? parseFloat(document.getElementById('deliveryCharge')?.value) || 0 : parseFloat(selDel.value) || 0; }
        const totalPrice = subtotal + deliveryCharge;
        await addDoc(collection(db, 'orders'), {
            name, phone: cleanPhone, location: loc, productCode: code,
            quantity: qty,
            unitPrice: unitPrice,
            subtotal: subtotal,
            deliveryCharge: deliveryCharge,
            totalPrice: totalPrice,
            comment: comment,
            orderTime: serverTimestamp(), status: 'Pending', createdAt: new Date().toISOString()
        });
        showToast('Order placed successfully!');
        closeModal();
    } catch (err) {
        alert('Order failed: ' + err.message);
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
    }
});

// ── Share ──────────────────────────────────────────────────────────────────
function shareProduct(code, name) {
    const url = `${location.origin}${location.pathname.replace('product-detail.html', '')}product-detail.html?code=${encodeURIComponent(code)}`;
    if (navigator.share) {
        navigator.share({ title: name, text: `${name} - Style Gallery`, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const el = document.getElementById('shareCopied');
            el.style.display = 'flex';
            setTimeout(() => { el.style.display = 'none'; }, 2500);
        }).catch(() => { prompt('লিংক কপি করুন:', url); });
    }
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('successToast');
    t.querySelector('span').textContent = msg;
    t.style.display = 'flex';
    setTimeout(() => { t.style.display = 'none'; }, 4000);
}

// ── Error ──────────────────────────────────────────────────────────────────
function showError() {
    document.getElementById('detailLoader').style.display = 'none';
    document.getElementById('detailError').style.display = 'block';
}

// ── Mobile menu ────────────────────────────────────────────────────────────
function setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-links');
    toggle?.addEventListener('click', () => {
        nav.classList.toggle('active');
        const icon = toggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}
