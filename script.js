// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const orderModal = document.getElementById('orderModal');
const orderForm = document.getElementById('orderForm');
const closeModal = document.querySelector('.close-modal');
const successToast = document.getElementById('successToast');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const homeLink = document.querySelector('.home-link');
const productsLink = document.querySelector('.products-link');
const aboutLink = document.querySelector('.about-link');
const contactLink = document.querySelector('.contact-link');

// Global variables
let db = null;
let currentProductCode = '';
let allProducts = [];
let swiper = null;

// Wait for Firebase to be ready
document.addEventListener('firebaseReady', () => {
    console.log('🔥 Firebase is ready, initializing...');
    if (window.firebaseDb && !db) {
        db = window.firebaseDb;
        initializeWebsite();
    }
});

// Also try to initialize after a delay
setTimeout(() => {
    if (!db && window.firebaseDb) {
        db = window.firebaseDb;
        initializeWebsite();
    } else if (!db) {
        console.log('⚠️ Firebase not ready, trying direct initialization...');
        initializeFirebaseDirectly();
    }
}, 1000);

// Direct Firebase initialization if needed
async function initializeFirebaseDirectly() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const firebaseConfig = {
            apiKey: "AIzaSyC2Bsd-HqfhhC8i5cQUF2ZmofUJaFIcvDs",
            authDomain: "lamim-754aa.firebaseapp.com",
            projectId: "lamim-754aa",
            storageBucket: "lamim-754aa.firebasestorage.app",
            messagingSenderId: "1087897423283",
            appId: "1:1087897423283:web:10a57c0acf8879fc1e4fc6",
            measurementId: "G-R5SNM13YMG"
        };
        
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('✅ Firebase initialized directly');
        initializeWebsite();
        
    } catch (error) {
        console.error('❌ Direct Firebase init failed:', error);
        showError('Failed to connect to server. Please refresh the page.');
    }
}

// Initialize website
function initializeWebsite() {
    // Load sliders from Firebase, then init Swiper
    loadSliderFromFirebase();
    
    // Load products
    loadProducts();
    
    // Setup all event listeners
    setupEventListeners();
}

// Load slider images from Firebase 'sliders' collection
async function loadSliderFromFirebase() {
    const wrapper = document.querySelector('.swiper-wrapper');
    if (!wrapper) { initializeSwiper(); return; }

    try {
        if (!db) throw new Error('no db');
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        let sliders = [];
        try {
            const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
            const snap = await getDocs(q);
            snap.forEach(d => sliders.push(d.data()));
        } catch {
            const snap = await getDocs(collection(db, 'sliders'));
            snap.forEach(d => sliders.push(d.data()));
        }

        if (sliders.length > 0) {
            wrapper.innerHTML = sliders.map(s => `
                <div class="swiper-slide">
                    ${s.link ? `<a href="${s.link}" target="_blank" style="display:block">` : ''}
                    <img src="${s.imageUrl}" alt="${s.title || 'Slide'}" style="width:100%;height:100%;object-fit:cover;display:block">
                    ${s.link ? '</a>' : ''}
                    <div class="slide-content"></div>
                </div>
            `).join('');
        }
    } catch(e) {
        // Firebase not ready or no sliders — keep static HTML slides
        console.log('Using static slides:', e.message);
    }
    initializeSwiper();
}

// Initialize Swiper slider
function initializeSwiper() {
    if (typeof Swiper !== 'undefined') {
        swiper = new Swiper('.mySwiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
        });
        
        console.log('✅ Swiper initialized');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Mobile menu toggle
    menuToggle.addEventListener('click', toggleMobileMenu);
    
    // Navigation links
    homeLink.addEventListener('click', handleHomeClick);
    productsLink.addEventListener('click', handleProductsClick);
    aboutLink.addEventListener('click', handleAboutClick);
    contactLink.addEventListener('click', handleContactClick);
    
    // Close mobile menu when clicking any nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.querySelector('i').classList.remove('fa-times');
            menuToggle.querySelector('i').classList.add('fa-bars');
        });
    });
    
    // Search functionality
    setupSearch();
    
    // Order modal
    closeModal.addEventListener('click', closeModalFunction);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeModalFunction();
        }
    });
    
    // Form submission
    orderForm.addEventListener('submit', submitOrder);
    
    // Contact form submission
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will contact you soon.');
        e.target.reset();
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Order button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('order-btn') || e.target.closest('.order-btn')) {
            const button = e.target.classList.contains('order-btn') ? e.target : e.target.closest('.order-btn');
            const productCode = button.dataset.productCode;
            const productName = button.dataset.productName;
            const productPrice = button.dataset.productPrice;
            if (productCode) {
                openOrderModal(productCode, productName, productPrice);
            } else {
                alert('Product information is missing. Please try another product.');
            }
        }
    });

    // Quantity +/- buttons and input change — update total price
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
        if (e.target.id === 'quantityInput' || e.target.id === 'deliveryCharge') { updateOrderTotal(); }
    });

    // Delivery radio change
    document.addEventListener('change', function(e) {
        if (e.target.name === 'deliveryType') {
            const customInput = document.getElementById('deliveryCharge');
            if (customInput) {
                customInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
                if (e.target.value !== 'custom') customInput.value = '';
            }
            updateOrderTotal();
        }
    });

    // Share button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('share-btn') || e.target.closest('.share-btn')) {
            const button = e.target.classList.contains('share-btn') ? e.target : e.target.closest('.share-btn');
            const productCode = button.dataset.productCode;
            const productName = button.dataset.productName;
            if (productCode) {
                shareProduct(productCode, productName, button);
            }
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    navLinks.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

// Handle home click
function handleHomeClick(e) {
    e.preventDefault();
    
    // Clear search
    searchInput.value = '';
    
    // Show all products
    displayProducts(allProducts);
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Update active nav link
    updateActiveNavLink('home');
}

// Handle products click
function handleProductsClick(e) {
    e.preventDefault();
    
    // Clear search
    searchInput.value = '';
    
    // Show all products
    displayProducts(allProducts);
    
    // Scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
        window.scrollTo({
            top: productsSection.offsetTop - 80,
            behavior: 'smooth'
        });
    }
    
    // Update active nav link
    updateActiveNavLink('products');
}

// Handle about click
function handleAboutClick(e) {
    e.preventDefault();
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        window.scrollTo({
            top: aboutSection.offsetTop - 80,
            behavior: 'smooth'
        });
    }
    updateActiveNavLink('about');
}

// Handle contact click
function handleContactClick(e) {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        window.scrollTo({
            top: contactSection.offsetTop - 80,
            behavior: 'smooth'
        });
    }
    updateActiveNavLink('contact');
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    // Remove active class from all links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (activeLink === 'home') {
        homeLink.classList.add('active');
    } else if (activeLink === 'products') {
        productsLink.classList.add('active');
    } else if (activeLink === 'about') {
        aboutLink.classList.add('active');
    } else if (activeLink === 'contact') {
        contactLink.classList.add('active');
    }
}

// Setup search functionality
function setupSearch() {
    // Real-time search on input
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Clear suggestions when input is empty
        if (!searchTerm) {
            searchSuggestions.classList.remove('active');
            searchSuggestions.innerHTML = '';
            // Show all products when search is cleared
            displayProducts(allProducts);
            return;
        }
        
        // Show suggestions
        showSearchSuggestions(searchTerm);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.remove('active');
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
                searchSuggestions.classList.remove('active');
            }
        }
    });
}

// Show search suggestions
function showSearchSuggestions(searchTerm) {
    if (!searchTerm || allProducts.length === 0) {
        searchSuggestions.classList.remove('active');
        searchSuggestions.innerHTML = '';
        return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get matching products
    const suggestions = allProducts.filter(product => {
        const name = product.name?.toLowerCase() || '';
        const code = product.productCode?.toLowerCase() || '';
        return name.includes(searchTermLower) || code.includes(searchTermLower);
    }).slice(0, 5); // Limit to 5 suggestions
    
    if (suggestions.length === 0) {
        searchSuggestions.classList.remove('active');
        searchSuggestions.innerHTML = '';
        return;
    }
    
    // Display suggestions
    searchSuggestions.innerHTML = suggestions.map(product => {
        const discount = product.discount || 0;
        const originalPrice = parseFloat(product.price) || 0;
        const discountedPrice = discount > 0 ? 
            (originalPrice - (originalPrice * discount / 100)).toFixed(2) : 
            originalPrice.toFixed(2);
        
        return `
            <div class="suggestion-item" data-product-code="${product.productCode}">
                <i class="fas fa-search"></i>
                <div>
                    <strong>${product.name}</strong>
                    <div style="font-size: 0.85rem; color: #6b7280;">
                        Code: ${product.productCode} | Price: TK${discountedPrice}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    searchSuggestions.classList.add('active');
    
    // Add click event to suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const productCode = this.dataset.productCode;
            const product = allProducts.find(p => p.productCode === productCode);
            if (product) {
                searchInput.value = product.name;
                performSearch(product.name);
                searchSuggestions.classList.remove('active');
            }
        });
    });
}

// Perform search
function performSearch(searchTerm) {
    if (!searchTerm) {
        // Show all products if search is empty
        displayProducts(allProducts);
        return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredProducts = allProducts.filter(product => {
        const name = product.name?.toLowerCase() || '';
        const code = product.productCode?.toLowerCase() || '';
        return name.includes(searchTermLower) || code.includes(searchTermLower);
    });
    
    displayProducts(filteredProducts);
    
    // Show message if no results
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No Products Found</h3>
                <p>No products match your search for "${searchTerm}"</p>
                <button onclick="clearSearch()" class="btn-primary" style="margin-top: 1.5rem;">
                    <i class="fas fa-times"></i> Clear Search
                </button>
            </div>
        `;
    }
}

// Clear search - now globally accessible
window.clearSearch = function() {
    searchInput.value = '';
    displayProducts(allProducts);
    searchSuggestions.classList.remove('active');
}

// Load products from Firestore
async function loadProducts() {
    if (!db) {
        console.log('Database not ready, waiting...');
        setTimeout(loadProducts, 1000);
        return;
    }
    
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const productsCol = collection(db, 'products');
        const snapshot = await getDocs(productsCol);
        
        allProducts = [];
        productsGrid.innerHTML = '';
        
        if (snapshot.empty) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Available</h3>
                    <p>Please check back later or contact admin.</p>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            allProducts.push(doc.data());
        });

        // পিন করা পণ্য সবার আগে
        allProducts.sort((a, b) => {
            if (b.pinned && !a.pinned) return 1;
            if (a.pinned && !b.pinned) return -1;
            return 0;
        });

        // ক্যাটাগরি বাটন তৈরি করি
        buildCategoryFilterBar(allProducts);

        // সব প্রোডাক্ট দেখাই
        allProducts.forEach(product => createProductCard(product));
        console.log(`✅ Loaded ${allProducts.length} products`);
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showError('Failed to load products. Please try again later.');
    }
}

// ── ক্যাটাগরি ফিল্টার বার তৈরি ───────────────────────────────────────────
const CATEGORY_ICONS = {
    'পোশাক':        'fas fa-tshirt',
    'টি-শার্ট':     'fas fa-tshirt',
    'শার্ট':        'fas fa-tshirt',
    'ইলেকট্রনিক্স': 'fas fa-mobile-alt',
    'জুতা':         'fas fa-shoe-prints',
    'ব্যাগ':         'fas fa-shopping-bag',
    'গহনা':         'fas fa-gem',
    'সৌন্দর্য':     'fas fa-spray-can',
    'খাবার':        'fas fa-apple-alt',
    'খেলনা':        'fas fa-gamepad',
    'আসবাবপত্র':   'fas fa-couch',
    'বই':           'fas fa-book',
    'অন্যান্য':     'fas fa-box',
};

function getCatIcon(cat) {
    return CATEGORY_ICONS[cat] || 'fas fa-tag';
}

function buildCategoryFilterBar(products) {
    const bar = document.getElementById('categoryFilterBar');
    if (!bar) return;

    // অনন্য ক্যাটাগরি
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];

    // শুধু "সব" বাটন রেখে বাকি সরাই
    bar.innerHTML = `
        <button class="cat-filter-btn active" data-cat="all">
            <i class="fas fa-border-all"></i> সব
        </button>
    `;

    // ক্যাটাগরি না থাকলে বার লুকাই
    if (cats.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-filter-btn';
        btn.dataset.cat = cat;
        btn.innerHTML = `<i class="${getCatIcon(cat)}"></i> ${cat}`;
        bar.appendChild(btn);
    });

    // ক্লিক ইভেন্ট
    bar.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            bar.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterByCategory(btn.dataset.cat);
        });
    });
}

function filterByCategory(cat) {
    const filtered = cat === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === cat);
    displayProducts(filtered);
}

// Create product card
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    const discount = product.discount || 0;
    const originalPrice = parseFloat(product.price) || 0;
    const discountedPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;
    
    const detailUrl = `product-detail.html?code=${encodeURIComponent(product.productCode || '')}`;
    const pinBadge = product.pinned ? '<span class="pin-badge"><i class="fas fa-thumbtack"></i> Featured</span>' : '';
    const catBadge = product.category ? `<span class="product-category-badge">${product.category}</span>` : '';

    productCard.innerHTML = `
        <a class="product-image product-image-link" href="${detailUrl}" title="View details">
            <img src="${product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                 alt="${product.name}" 
                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
            ${pinBadge}
            <div class="view-detail-overlay"><i class="fas fa-eye"></i> বিস্তারিত দেখুন</div>
        </a>
        <div class="product-info">
            ${catBadge}
            <a class="product-name-link" href="${detailUrl}">
                <h3 class="product-name">${product.name || 'Product Name'}</h3>
            </a>
            <div class="product-price">
                <span class="current-price">TK ${discountedPrice.toFixed(2)}</span>
                ${discount > 0 ? `
                    <span class="original-price">TK ${originalPrice.toFixed(2)}</span>
                    <span class="discount">${discount}% OFF</span>
                ` : ''}
            </div>
            <p class="product-code">Product Code: <span>${product.productCode || 'N/A'}</span></p>
            <div class="product-actions">
                <button class="btn-primary order-btn" 
                        data-product-code="${product.productCode}"
                        data-product-name="${product.name}"
                        data-product-price="${discountedPrice.toFixed(2)}">
                    <i class="fas fa-shopping-cart"></i> Order Now
                </button>
                <button class="btn-share share-btn" 
                        data-product-code="${product.productCode}"
                        data-product-name="${product.name}"
                        title="Share this product">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    productsGrid.appendChild(productCard);
}

// Display products (for search)
function displayProducts(products) {
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No Products Found</h3>
                <p>Try a different search term.</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => createProductCard(product));
}

// Show error message
function showError(message) {
    productsGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Something Went Wrong</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn-primary" style="margin-top: 1.5rem;">
                <i class="fas fa-redo"></i> Reload Page
            </button>
        </div>
    `;
}

// Open order modal
function openOrderModal(productCode, productName, productPrice) {
    console.log('Opening order modal for:', productCode, productName, productPrice);

    // Store current product price globally
    window._currentOrderPrice = parseFloat(productPrice) || 0;

    // Set product code
    document.getElementById('productCode').value = productCode;

    // Reset quantity to 1
    const qtyInput = document.getElementById('quantityInput');
    if (qtyInput) { qtyInput.value = 1; }

    // Show/update total price box
    updateOrderTotal();

    // Show product name in modal
    const modalTitle = document.querySelector('#orderModal h2');
    if (modalTitle && productName) {
        modalTitle.textContent = `Order: ${productName}`;
    }

    // Show modal with animation
    orderModal.style.display = 'flex';
    orderModal.style.opacity = '0';
    orderModal.style.transition = 'opacity 0.3s ease';

    setTimeout(() => { orderModal.style.opacity = '1'; }, 10);
    setTimeout(() => { document.getElementById('customerName')?.focus(); }, 300);
}

// Calculate and update total price display
function updateOrderTotal() {
    const price = window._currentOrderPrice || 0;
    const qty = parseInt(document.getElementById('quantityInput')?.value) || 1;
    const subtotal = price * qty;

    // Get delivery charge
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    let delivery = 0;
    if (selected) {
        if (selected.value === 'custom') {
            delivery = parseFloat(document.getElementById('deliveryCharge')?.value) || 0;
        } else {
            delivery = parseFloat(selected.value) || 0;
        }
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

// Close modal function
function closeModalFunction() {
    orderModal.style.opacity = '0';
    setTimeout(() => {
        orderModal.style.display = 'none';
        orderForm.reset();
        const ci = document.getElementById('deliveryCharge');
        if (ci) ci.style.display = 'none';
        const box = document.getElementById('totalPriceBox');
        if (box) box.style.display = 'none';
        // Reset to step 1
        document.getElementById('orderStep1').style.display = 'block';
        document.getElementById('orderStep2').style.display = 'none';
        document.getElementById('step1Dot').classList.add('active');
        document.getElementById('step2Dot').classList.remove('active');
        document.getElementById('transactionId') && (document.getElementById('transactionId').value = '');
    }, 300);
}

// Submit order
// ── Step 1 → Step 2 (Payment) ────────────────────────────────────────────
async function submitOrder(e) {
    e.preventDefault();

    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const location = document.getElementById('location').value.trim();
    const productCode = document.getElementById('productCode').value.trim();
    const quantity = parseInt(document.getElementById('quantityInput')?.value) || 1;
    const comment = document.getElementById('customerComment')?.value.trim() || '';
    const unitPrice = window._currentOrderPrice || 0;
    const subtotal = unitPrice * quantity;
    const selectedDelivery = document.querySelector('input[name="deliveryType"]:checked');
    let deliveryCharge = 0;
    if (selectedDelivery) {
        deliveryCharge = selectedDelivery.value === 'custom'
            ? parseFloat(document.getElementById('deliveryCharge')?.value) || 0
            : parseFloat(selectedDelivery.value) || 0;
    }
    const totalPrice = subtotal + deliveryCharge;

    const phoneRegex = /^(?:\+88|01)?\d{11}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        alert('সঠিক ফোন নম্বর দিন (১১ সংখ্যা, যেমন: 01712345678)');
        document.getElementById('phoneNumber').focus();
        return;
    }
    if (!name || !location || !productCode) {
        alert('সব তথ্য পূরণ করুন');
        return;
    }
    if (!selectedDelivery) {
        alert('ডেলিভারি চার্জ বেছে নিন');
        return;
    }

    // Save order data for step 2
    window._pendingOrder = { name, phone: cleanPhone, location, productCode, quantity, comment, unitPrice, subtotal, deliveryCharge, totalPrice };

    // Update amount in payment instructions
    const amountText = `TK ${deliveryCharge}`;
    document.getElementById('bkashAmount').textContent = amountText;
    document.getElementById('nagadAmount').textContent = amountText;
    document.getElementById('rocketAmount').textContent = amountText;
    const payAmountEl = document.getElementById('payAmountDisplay');
    if (payAmountEl) payAmountEl.textContent = amountText;

    // Go to step 2
    document.getElementById('orderStep1').style.display = 'none';
    document.getElementById('orderStep2').style.display = 'block';
    document.getElementById('step1Dot').classList.remove('active');
    document.getElementById('step2Dot').classList.add('active');
    document.querySelector('.modal-content').scrollTop = 0;
}

// ── Back to step 1 ───────────────────────────────────────────────────────
document.getElementById('backToOrderBtn')?.addEventListener('click', () => {
    document.getElementById('orderStep2').style.display = 'none';
    document.getElementById('orderStep1').style.display = 'block';
    document.getElementById('step2Dot').classList.remove('active');
    document.getElementById('step1Dot').classList.add('active');
});

// ── Payment method tabs ──────────────────────────────────────────────────
document.querySelectorAll('.pay-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pay-instruction').forEach(i => i.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`inst-${btn.dataset.method}`)?.classList.add('active');
    });
});

// ── Copy number ──────────────────────────────────────────────────────────
window.copyNumber = function(num, btn) {
    navigator.clipboard.writeText(num).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> হয়েছে!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> কপি';
            btn.style.background = '';
        }, 2000);
    });
};

// ── Verify & Place Order ─────────────────────────────────────────────────
document.getElementById('verifyAndOrderBtn')?.addEventListener('click', async () => {
    const txnId = document.getElementById('transactionId').value.trim();
    if (!txnId) {
        alert('ট্রানজেকশন আইডি দিন!');
        document.getElementById('transactionId').focus();
        return;
    }

    const order = window._pendingOrder;
    if (!order) { alert('অর্ডার তথ্য পাওয়া যায়নি।'); return; }

    const activeMethod = document.querySelector('.pay-tab.active')?.dataset.method || 'bkash';

    const btn = document.getElementById('verifyAndOrderBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রসেস হচ্ছে...';
    btn.disabled = true;

    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        if (!db) throw new Error('Database not connected');

        const orderData = {
            ...order,
            paymentMethod: activeMethod,
            transactionId: txnId,
            orderTime: serverTimestamp(),
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'orders'), orderData);
        showToast(`✅ অর্ডার সফল হয়েছে! Order ID: ${docRef.id.substring(0, 8)}`);
        closeModalFunction();
        document.getElementById('transactionId').value = '';
        window._pendingOrder = null;
    } catch (error) {
        console.error('❌ Order error:', error);
        alert(`অর্ডার ব্যর্থ হয়েছে: ${error.message}`);
    } finally {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & অর্ডার করুন';
        btn.disabled = false;
    }
});

// Show toast notification
function showToast(message = 'Order placed successfully!') {
    successToast.querySelector('span').textContent = message;
    successToast.style.display = 'flex';
    successToast.style.animation = 'toastSlide 0.3s ease';
    
    setTimeout(() => {
        successToast.style.display = 'none';
    }, 5000);
}

// Share product - generates unique link per product
function shareProduct(productCode, productName, button) {
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('index.html','').replace(/\/$/,'')+'/'}product-detail.html?code=${encodeURIComponent(productCode)}`;
    
    if (navigator.share) {
        // Native share (mobile)
        navigator.share({
            title: productName || 'Check out this product',
            text: `${productName} - Style Gallery`,
            url: shareUrl
        }).catch(() => {});
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showShareToast(button);
        }).catch(() => {
            // Fallback: show link in prompt
            prompt('এই লিংকটি কপি করুন:', shareUrl);
        });
    }
}

// Show "Copied!" toast near share button
function showShareToast(button) {
    // Remove any existing share tooltip
    document.querySelectorAll('.share-tooltip').forEach(el => el.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'share-tooltip';
    tooltip.innerHTML = '<i class="fas fa-check"></i> লিংক কপি হয়েছে!';
    
    button.style.position = 'relative';
    button.appendChild(tooltip);
    
    setTimeout(() => tooltip.remove(), 2500);
}

// Check URL for shared product and highlight it
function checkUrlForProduct() {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('product');
    if (!sharedCode) return;

    // Wait for products to load, then find and highlight
    const interval = setInterval(() => {
        const allCards = document.querySelectorAll('.product-card');
        if (allCards.length === 0) return;

        clearInterval(interval);

        // Find matching card
        const matchingBtn = document.querySelector(`.order-btn[data-product-code="${sharedCode}"]`);
        if (matchingBtn) {
            const card = matchingBtn.closest('.product-card');
            if (card) {
                // Scroll to it
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('shared-highlight');
                    setTimeout(() => card.classList.remove('shared-highlight'), 3000);
                }, 500);
            }
        }
    }, 300);

    // Give up after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded');
    
    // Check if Firebase is already initialized
    if (window.firebaseDb) {
        db = window.firebaseDb;
        initializeWebsite();
    } else if (window.firebaseApp) {
        import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js')
            .then(({ getFirestore }) => {
                db = getFirestore(window.firebaseApp);
                initializeWebsite();
            })
            .catch(error => {
                console.error('Firestore import error:', error);
                initializeFirebaseDirectly();
            });
    }
    
    // Make functions globally accessible
    window.clearSearch = clearSearch;

    // Check URL for shared product
    checkUrlForProduct();
});

// ── WhatsApp Floating Button – Drag & Click ───────────────────────────────
(function() {
    const WA_NUMBER = '8801922903581'; // আপনার নম্বর
    const WA_MSG = encodeURIComponent('হ্যালো, আমি EH Brand থেকে কথা বলতে চাই।');

    const btn = document.getElementById('waFloat');
    if (!btn) return;

    let isDragging = false;
    let startX, startY, startLeft, startTop, moved;

    function getPos() {
        const rect = btn.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    }

    function setPos(x, y) {
        const W = window.innerWidth, H = window.innerHeight;
        const bW = btn.offsetWidth, bH = btn.offsetHeight;
        let nx = Math.max(0, Math.min(x, W - bW));
        let ny = Math.max(0, Math.min(y, H - bH));
        btn.style.left = nx + 'px';
        btn.style.top  = ny + 'px';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
    }

    // Mouse
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
        if (!moved) openWA();
    });

    // Touch
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
        if (!moved) openWA();
    });

    function openWA() {
        window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`, '_blank');
    }
})();
