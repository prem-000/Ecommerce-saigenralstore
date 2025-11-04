// ================== MENU & UI CONTROL ==================
const searchForm = document.querySelector('.search-form');
const shoppingCart = document.querySelector('.shopping-cart');
const cartIcon = document.querySelector('#cart-btn');

cartIcon?.addEventListener('click', () => {
    shoppingCart.classList.toggle('active');
    searchForm?.classList.remove('active');
});

window.addEventListener('scroll', () => {
    searchForm?.classList.remove('active');
    shoppingCart?.classList.remove('active');
});

// ================== READ MORE BUTTON ==================
document.querySelectorAll(".readmore-btn").forEach(button => {
    button.addEventListener("click", function (e) {
        e.preventDefault();
        const text = this.previousElementSibling;
        if (text.style.display === "none") {
            text.style.display = "block";
            this.textContent = "read less";
        } else {
            text.style.display = "none";
            this.textContent = "read more";
        }
    });
});

// ================== PRODUCT SEARCH ==================
const searchInput = document.querySelector("#search-box");
const productBoxes = document.querySelectorAll(".categories .product-row .box");

searchInput?.addEventListener("keyup", () => {
    const searchText = searchInput.value.toLowerCase().trim();
    let foundBox = null;

    document.querySelector(".search-popup")?.remove();

    productBoxes.forEach(box => {
        const productName = box.querySelector("h3").textContent.toLowerCase();
        if (productName.includes(searchText) && searchText !== "") {
            foundBox = box;
        }
        box.style.display = productName.includes(searchText) ? "inline-block" : "none";
    });

    let noResultMsg = document.querySelector(".no-result");
    const categorySection = document.querySelector(".categories");

    if (!foundBox && searchText !== "") {
        if (!noResultMsg) {
            noResultMsg = document.createElement("div");
            noResultMsg.className = "no-result";
            noResultMsg.textContent = "❌ No product found";
            noResultMsg.style.textAlign = "center";
            noResultMsg.style.fontSize = "1.6rem";
            noResultMsg.style.marginTop = "1rem";
            categorySection.appendChild(noResultMsg);
        }
    } else if (noResultMsg) {
        noResultMsg.remove();
    }

    if (searchText === "") {
        productBoxes.forEach(box => (box.style.display = "inline-block"));
        noResultMsg?.remove();
        return;
    }

    // Auto scroll + popup
    if (foundBox) {
        foundBox.scrollIntoView({ behavior: "smooth", block: "center" });

        const imgSrc = foundBox.querySelector("img").src;
        const productName = foundBox.querySelector("h3").textContent;

        const popup = document.createElement("div");
        popup.className = "search-popup";
        popup.innerHTML = `
            <img src="${imgSrc}" alt="${productName}">
            <div class="popup-content">
                <h4>${productName}</h4>
                <p>✅ Moved to this product</p>
            </div>
        `;
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 3000);
    }
});

// ================== CART FUNCTIONALITY ==================
let cart = [];

function extractPrice(priceText) {
    const num = priceText.replace(/[^\d.]/g, "");
    return parseFloat(num) || 0;
}

function updateCartUI() {
    const cartContainer = document.querySelector(".shopping-cart");
    const cartIcon = document.querySelector("#cart-btn");
    if (!cartContainer || !cartIcon) return;

    // 🛒 Cart badge setup
    let badge = document.querySelector(".cart-count");
    if (!badge) {
        badge = document.createElement("span");
        badge.classList.add("cart-count");
        cartIcon.style.position = "relative";
        cartIcon.appendChild(badge);
    }

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";

    // Clear old cart UI
    cartContainer.querySelectorAll(".cart-item, .total, .address-section, .payment-section, .empty-cart").forEach(el => el.remove());

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.classList.add("empty-cart");
        empty.innerHTML = `
            <p style="text-align:center; font-size:1.5rem; color:gray; margin:1rem 0;">
                🛒 Your cart is empty! <br>
                <span style="color:var(--orange); cursor:pointer; text-decoration:underline;">Add items from categories</span>
            </p>`;
        empty.querySelector("span").addEventListener("click", () => {
            shoppingCart.classList.remove("active");
            document.querySelector(".categories").scrollIntoView({ behavior: "smooth" });
        });
        cartContainer.appendChild(empty);
        return;
    }

    // 🧾 Add cart items
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        const box = document.createElement("div");
        box.classList.add("cart-item");
        box.innerHTML = `
            <i class="fas fa-trash"></i>
            <img src="${item.img}" alt="">
            <div class="content">
                <h3>${item.name}</h3>
                <span class="price">₹${item.price}</span>
                <div class="quantity-controls">
                    <button class="decrease">−</button>
                    <span class="quantity">${item.qty}</span>
                    <button class="increase">+</button>
                </div>
            </div>
        `;

        // Quantity & delete handlers
        box.querySelector(".fa-trash").addEventListener("click", () => {
            cart = cart.filter(p => p.name !== item.name);
            updateCartUI();
        });
        box.querySelector(".increase").addEventListener("click", () => {
            item.qty++;
            updateCartUI();
        });
        box.querySelector(".decrease").addEventListener("click", () => {
            item.qty--;
            if (item.qty <= 0) cart = cart.filter(p => p.name !== item.name);
            updateCartUI();
        });

        cartContainer.appendChild(box);
    });

    // 💰 Total price
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("total");
    totalDiv.innerHTML = `<h3 style="text-align:center;">Total : ₹${total.toFixed(2)}</h3>`;
    cartContainer.appendChild(totalDiv);

    // 🏠 Address Section
    const addressSection = document.createElement("div");
    addressSection.classList.add("address-section");
    const savedAddress = localStorage.getItem("userAddress") || "";
    addressSection.innerHTML = `
        <h4 style="text-align:center; margin-top:1rem;">Enter Delivery Address 🏠</h4>
        <select id="savedAddressSelect" style="width:90%; margin:0.5rem auto; display:block; padding:8px; border-radius:10px;">
            <option value="">Select saved address</option>
            ${savedAddress ? `<option value="${savedAddress}" selected>${savedAddress}</option>` : ""}
        </select>
        <textarea id="addressInput" placeholder="Enter your full address here" rows="3" style="width:90%; display:block; margin:0.5rem auto; border-radius:10px; padding:8px;"></textarea>
        <button id="saveAddressBtn" class="btn" style="display:block; margin:0.5rem auto;">Save Address</button>
        <p id="addressSavedMsg" style="text-align:center; color:green; display:${savedAddress ? 'block' : 'none'};">✅ Address saved!</p>
    `;
    cartContainer.appendChild(addressSection);

    // 💳 Payment section (Updated)
    const paymentSection = document.createElement("div");
    paymentSection.classList.add("payment-section");
    paymentSection.innerHTML = `
        <h4 style="text-align:center; margin-top:1rem;">Select Payment Method</h4>
        <div class="payment-options" style="text-align:center; opacity:0.6;">
            <label><input type="radio" name="payment" value="cash" disabled> Cash on Delivery 💵</label><br>
            <label><input type="radio" name="payment" value="upi" disabled>
                <img src="https://img.icons8.com/?size=100&id=ugDgmU0qYRe3&format=png&color=000000" width="40">
                UPI Payment
            </label><br>
            <label><input type="radio" name="payment" value="credit" disabled>
                <img src="https://img.icons8.com/color/48/000000/bank-card-back-side.png" width="40">
                Credit/Debit Card 💳
            </label><br>
            <label><input type="radio" name="payment" value="wallet" disabled>
                <img src="https://img.icons8.com/fluency/48/000000/wallet.png" width="40">
                Wallet (Sai Stores)
            </label><br>
        </div>
        <button id="checkout-btn" class="btn" style="display:block; margin:1rem auto;" disabled>Proceed</button>
        <p id="paymentHint" style="text-align:center; color:orange;">⚠️ Please enter or select an address first</p>
    `;
    cartContainer.appendChild(paymentSection);


    // 🧠 Address Logic
    const addressInput = document.getElementById("addressInput");
    const saveBtn = document.getElementById("saveAddressBtn");
    const savedSelect = document.getElementById("savedAddressSelect");
    const paymentInputs = paymentSection.querySelectorAll("input[name='payment']");
    const proceedBtn = document.getElementById("checkout-btn");
    const paymentHint = document.getElementById("paymentHint");

    function enablePaymentSection() {
        paymentInputs.forEach(inp => inp.disabled = false);
        proceedBtn.disabled = false;
        paymentSection.querySelector(".payment-options").style.opacity = "1";
        paymentHint.style.display = "none";
    }

    // If saved address already exists, enable payment
    if (savedAddress) enablePaymentSection();

    // Save address button click
    saveBtn.addEventListener("click", () => {
        const address = addressInput.value.trim();
        if (!address) {
            alert("Please enter your address!");
            return;
        }
        localStorage.setItem("userAddress", address);
        document.getElementById("addressSavedMsg").style.display = "block";
        savedSelect.innerHTML = `<option value="${address}" selected>${address}</option>`;
        alert("Address saved successfully!");
        enablePaymentSection();
    });

    // If user selects saved address
    savedSelect.addEventListener("change", () => {
        const selected = savedSelect.value;
        if (selected) {
            localStorage.setItem("userAddress", selected);
            enablePaymentSection();
        }
    });

    // Proceed button logic
    proceedBtn.addEventListener("click", () => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;
        if (!selectedPayment) {
            alert("Please select a payment method!");
            return;
        }

        const totalAmount = parseFloat(document.querySelector(".total h3").innerText.replace("Total : ₹", ""));

        if (selectedPayment === "wallet") {
            localStorage.setItem("walletPayment", JSON.stringify({ amount: totalAmount }));
            window.location.href = "profile.html#walletSection"; // Redirect to wallet section
            return;
        }

        if (selectedPayment === "upi") {
            window.location.href = "upipayment.html";
        } else if (selectedPayment === "credit") {
            window.location.href = "credit.html";
        } else {
            showReceiptPopup(); // Cash on Delivery
        }
    });



    // Save data
    localStorage.setItem("userCart", JSON.stringify(cart));
    localStorage.setItem("userTotal", total.toFixed(2));
}


// ================== ADD TO CART ==================
document.querySelectorAll(".product-row .box .btn").forEach(btn => {
    btn.addEventListener("click", e => {
        e.preventDefault();
        const box = btn.closest(".box");
        const name = box.querySelector("h3").textContent;
        const price = extractPrice(box.querySelector(".price").textContent);
        const img = box.querySelector("img").src;

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ name, price, img, qty: 1 });
        }

        btn.textContent = "Added ✅";
        btn.style.background = "green";
        setTimeout(() => {
            btn.textContent = "Add to cart";
            btn.style.background = "";
        }, 3000);

        updateCartUI();
    });
});

// ================== RECEIPT POPUP ==================
function showReceiptPopup() {
    const receipt = document.createElement("div");
    receipt.classList.add("receipt-popup");
    receipt.innerHTML = `
        <div class="receipt-paper">
            <h3>🧾 Sai Stores</h3>
            <p>Order Confirmed Successfully!</p>
            <p>Payment: Cash on Delivery</p>
            <p>Thank you for shopping 💚</p>
            <div class="delivery-animation">
                <img src="https://img.icons8.com/color/96/delivery--v1.png" alt="Delivery Truck" />
                <div class="road"></div>
            </div>
            <button id="close-receipt" class="btn">Close</button>
        </div>
    `;
    document.body.appendChild(receipt);

    document.getElementById("close-receipt").addEventListener("click", () => {
        receipt.remove();
    });

    createPaperConfetti();
}

// ================== CELEBRATION EFFECT ==================
function createPaperConfetti() {
    const colors = [
        "#ff595e", "#ffca3a", "#8ac926",
        "#1982c4", "#6a4c93", "#ff9f1c",
        "#ff577f", "#06d6a0", "#8338ec", "#ffd60a"
    ];

    const shapes = ["square", "circle", "triangle", "strip"];

    for (let i = 0; i < 120; i++) { // 🎉 More papers (120 pieces)
        const paper = document.createElement("div");
        paper.classList.add("paper-piece");
        document.body.appendChild(paper);

        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 6;

        // 🎨 Base styles
        paper.style.position = "fixed";
        paper.style.top = "-10px";
        paper.style.left = `${Math.random() * 100}vw`;
        paper.style.zIndex = 9999;
        paper.style.opacity = Math.random() * 0.9 + 0.4;
        paper.style.background = color;
        paper.style.pointerEvents = "none";
        paper.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;

        // 🟦 Shape types
        if (shape === "circle") {
            paper.style.borderRadius = "50%";
            paper.style.width = `${size}px`;
            paper.style.height = `${size}px`;
        } else if (shape === "triangle") {
            paper.style.width = "0";
            paper.style.height = "0";
            paper.style.borderLeft = `${size / 1.5}px solid transparent`;
            paper.style.borderRight = `${size / 1.5}px solid transparent`;
            paper.style.borderBottom = `${size * 1.8}px solid ${color}`;
            paper.style.background = "none";
        } else if (shape === "strip") {
            paper.style.width = `${size * 0.6}px`;
            paper.style.height = `${size * 3}px`;
            paper.style.borderRadius = "2px";
        } else {
            // square default
            paper.style.width = `${size}px`;
            paper.style.height = `${size}px`;
        }

        // 🎢 Random spin + horizontal drift
        const spin = Math.random() * 720;
        const drift = Math.random() * 50 - 25;
        paper.style.transform = `rotate(${spin}deg) translateX(${drift}px)`;
        paper.style.transition = "transform 0.3s ease-in-out";

        setTimeout(() => paper.remove(), 5000);
    }
}


// ================== Initialize ==================
updateCartUI();

// profile.js

// Fetch stored cart data
const cartData = JSON.parse(localStorage.getItem("userCart")) || [];
const totalSpent = localStorage.getItem("userTotal") || 0;

// Update user info
document.getElementById("totalSpent").textContent = totalSpent;
document.getElementById("totalItems").textContent = cartData.length;

// Render order list
const orderList = document.getElementById("orderList");

if (cartData.length === 0) {
  orderList.innerHTML = `<p style="text-align:center; color:gray;">No items in your cart.</p>`;
} else {
  cartData.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("order-item");
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div>
        <h4>${item.name}</h4>
        <p>Qty: ${item.qty}</p>
      </div>
      <strong>₹${item.price * item.qty}</strong>
    `;
    orderList.appendChild(div);
  });
} 