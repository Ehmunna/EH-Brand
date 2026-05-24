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

    // Load related products
    if (p.productCode) loadRelatedProducts(p.productCode);
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
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('orderForm').reset();
        // Reset to step 1
        document.getElementById('orderStep1').style.display = 'block';
        document.getElementById('orderStep2').style.display = 'none';
        document.getElementById('step1Dot').classList.add('active');
        document.getElementById('step2Dot').classList.remove('active');
        const txn = document.getElementById('transactionId');
        if (txn) txn.value = '';
        const ci = document.getElementById('deliveryCharge');
        if (ci) ci.style.display = 'none';
        const box = document.getElementById('totalPriceBox');
        if (box) box.style.display = 'none';
    }, 300);
}

document.querySelector('.close-modal').addEventListener('click', closeModal);
window.addEventListener('click', e => { if (e.target === document.getElementById('orderModal')) closeModal(); });

// ── Step 1 → Step 2 ───────────────────────────────────────────────────────
document.getElementById('orderForm').addEventListener('submit', (e) => {
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
    if (!name || !loc || !code) { alert('সব তথ্য পূরণ করুন'); return; }
    const selDel = document.querySelector('input[name="deliveryType"]:checked');
    if (!selDel) { alert('ডেলিভারি চার্জ বেছে নিন'); return; }

    const qty = parseInt(document.getElementById('quantityInput')?.value) || 1;
    const comment = document.getElementById('customerComment')?.value.trim() || '';
    const unitPrice = window._currentOrderPrice || 0;
    const subtotal = unitPrice * qty;
    let deliveryCharge = selDel.value === 'custom'
        ? parseFloat(document.getElementById('deliveryCharge')?.value) || 0
        : parseFloat(selDel.value) || 0;
    const totalPrice = subtotal + deliveryCharge;

    // Save pending order
    window._pendingOrder = { name, phone: cleanPhone, location: loc, productCode: code, quantity: qty, comment, unitPrice, subtotal, deliveryCharge, totalPrice };

    // Set amount in payment steps
    const amtText = `TK ${deliveryCharge}`;
    ['bkashAmount','nagadAmount','rocketAmount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = amtText;
    });
    const payAmountEl = document.getElementById('payAmountDisplay');
    if (payAmountEl) payAmountEl.textContent = amtText;

    // Go to step 2
    document.getElementById('orderStep1').style.display = 'none';
    document.getElementById('orderStep2').style.display = 'block';
    document.getElementById('step1Dot').classList.remove('active');
    document.getElementById('step2Dot').classList.add('active');
    document.querySelector('.modal-content').scrollTop = 0;
});

// ── Back button ──────────────────────────────────────────────────────────
document.getElementById('backToOrderBtn')?.addEventListener('click', () => {
    document.getElementById('orderStep2').style.display = 'none';
    document.getElementById('orderStep1').style.display = 'block';
    document.getElementById('step2Dot').classList.remove('active');
    document.getElementById('step1Dot').classList.add('active');
});

// ── Payment method tabs ───────────────────────────────────────────────────
document.querySelectorAll('.pay-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pay-instruction').forEach(i => i.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`inst-${btn.dataset.method}`)?.classList.add('active');
    });
});

// ── Copy number ───────────────────────────────────────────────────────────
window.copyNumber = function(num, btn) {
    navigator.clipboard.writeText(num).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> হয়েছে!';
        btn.style.background = '#10b981';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> কপি'; btn.style.background = ''; }, 2000);
    });
};

// ── Verify & Place Order ─────────────────────────────────────────────────
document.getElementById('verifyAndOrderBtn')?.addEventListener('click', async () => {
    const txnId = document.getElementById('transactionId').value.trim();
    if (!txnId) { alert('ট্রানজেকশন আইডি দিন!'); return; }
    const order = window._pendingOrder;
    if (!order) { alert('অর্ডার তথ্য পাওয়া যায়নি।'); return; }
    const activeMethod = document.querySelector('.pay-tab.active')?.dataset.method || 'bkash';
    const btn = document.getElementById('verifyAndOrderBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রসেস হচ্ছে...';
    btn.disabled = true;
    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        await addDoc(collection(db, 'orders'), {
            ...order,
            paymentMethod: activeMethod,
            transactionId: txnId,
            orderTime: serverTimestamp(),
            status: 'Pending',
            createdAt: new Date().toISOString()
        });
        showToast('✅ অর্ডার সফল হয়েছে!');
        closeModal();
        window._pendingOrder = null;
    } catch (err) {
        alert('অর্ডার ব্যর্থ: ' + err.message);
    } finally {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & অর্ডার করুন';
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

// ── Related Products ───────────────────────────────────────────────────────
async function loadRelatedProducts(currentCode) {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const snap = await getDocs(collection(db, 'products'));
        const related = [];
        snap.forEach(doc => {
            const d = doc.data();
            if (d.productCode !== currentCode && related.length < 8) {
                related.push(d);
            }
        });
        if (related.length === 0) return;

        const section = document.getElementById('relatedSection');
        const grid = document.getElementById('relatedGrid');
        grid.innerHTML = '';

        related.forEach(p => {
            const discount = p.discount || 0;
            const orig = parseFloat(p.price) || 0;
            const price = discount > 0 ? orig - (orig * discount / 100) : orig;
            const img = p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

            const card = document.createElement('a');
            card.className = 'related-card';
            card.href = `product-detail.html?code=${encodeURIComponent(p.productCode)}`;
            card.innerHTML = `
                <img src="${img}" alt="${p.name || ''}" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                <div class="related-card-info">
                    <h4>${p.name || 'Product'}</h4>
                    <span class="rc-price">TK ${price.toFixed(0)}</span>
                </div>
            `;
            grid.appendChild(card);
        });

        section.style.display = 'block';
    } catch (err) {
        console.error('Related products error:', err);
    }
}

// ── WhatsApp Floating Button – Drag & Click ───────────────────────────────
(function() {
    const WA_NUMBER = '8801922903581';
    const WA_MSG = encodeURIComponent('হ্যালো, আমি EH Brand থেকে কথা বলতে চাই।');

    const btn = document.getElementById('waFloat');
    if (!btn) return;

    let isDragging = false, moved = false;
    let startX, startY, startLeft, startTop;

    function getPos() {
        const rect = btn.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    }
    function setPos(x, y) {
        const W = window.innerWidth, H = window.innerHeight;
        const bW = btn.offsetWidth, bH = btn.offsetHeight;
        btn.style.left   = Math.max(0, Math.min(x, W - bW)) + 'px';
        btn.style.top    = Math.max(0, Math.min(y, H - bH)) + 'px';
        btn.style.right  = 'auto';
        btn.style.bottom = 'auto';
    }

    btn.addEventListener('mousedown', e => {
        e.preventDefault();
        isDragging = true; moved = false;
        const pos = getPos();
        startX = e.clientX; startY = e.clientY;
        startLeft = pos.left; startTop = pos.top;
        btn.classList.add('dragging');
    });
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        setPos(startLeft + dx, startTop + dy);
    });
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        btn.classList.remove('dragging');
        if (!moved) window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`, '_blank');
    });

    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        isDragging = true; moved = false;
        const pos = getPos();
        startX = t.clientX; startY = t.clientY;
        startLeft = pos.left; startTop = pos.top;
        btn.classList.add('dragging');
    }, { passive: false });
    document.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const t = e.touches[0];
        const dx = t.clientX - startX, dy = t.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        setPos(startLeft + dx, startTop + dy);
    }, { passive: true });
    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        btn.classList.remove('dragging');
        if (!moved) window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`, '_blank');
    });
})();
