// ================== API BASE URL ==================
const API_BASE = "https://saigenralstorebackend.onrender.com";

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

// ================== LOAD PRODUCTS FROM BACKEND ==================
async function loadProducts() {
    const container = document.querySelector(".categories .product-row");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");

        const products = await res.json();
        container.innerHTML = "";

        products.forEach(p => {
            const box = document.createElement("div");
            box.classList.add("box");
            box.innerHTML = `
                <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.description || ''}</p>
                <div class="price">₹${p.price}</div>
                <a href="#" class="btn">Add to cart</a>
            `;
            container.appendChild(box);
        });

        attachCartHandlers();
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="text-align:center;color:red;">⚠️ Failed to load products</p>`;
    }
}

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

    const totalDiv = document.createElement("div");
    totalDiv.classList.add("total");
    totalDiv.innerHTML = `<h3 style="text-align:center;">Total : ₹${total.toFixed(2)}</h3>`;
    cartContainer.appendChild(totalDiv);

    const addressSection = document.createElement("div");
    addressSection.classList.add("address-section");
    const savedAddress = localStorage.getItem("userAddress") || "";
    addressSection.innerHTML = `
        <h4 style="text-align:center; margin-top:1rem;">Enter Delivery Address 🏠</h4>
        <textarea id="addressInput" placeholder="Enter your address" rows="3" style="width:90%; margin:0.5rem auto; display:block; border-radius:10px; padding:8px;">${savedAddress}</textarea>
        <button id="saveAddressBtn" class="btn" style="display:block; margin:0.5rem auto;">Save Address</button>
    `;
    cartContainer.appendChild(addressSection);

    const paymentSection = document.createElement("div");
    paymentSection.classList.add("payment-section");
    paymentSection.innerHTML = `
        <h4 style="text-align:center;">Select Payment Method</h4>
        <label style="display:block;text-align:center;"><input type="radio" name="payment" value="cash"> Cash on Delivery 💵</label>
        <button id="checkout-btn" class="btn" style="display:block; margin:1rem auto;">Proceed</button>
    `;
    cartContainer.appendChild(paymentSection);

    document.getElementById("saveAddressBtn").addEventListener("click", () => {
        const address = document.getElementById("addressInput").value.trim();
        if (!address) return alert("Enter address!");
        localStorage.setItem("userAddress", address);
        alert("✅ Address saved!");
    });

    document.getElementById("checkout-btn").addEventListener("click", async () => {
        const address = localStorage.getItem("userAddress");
        if (!address) return alert("Enter delivery address first!");

        try {
            await saveOrderToBackend(cart);
            showReceiptPopup();
            cart = [];
            updateCartUI();
        } catch (err) {
            alert("Order failed: " + err.message);
        }
    });

    localStorage.setItem("userCart", JSON.stringify(cart));
    localStorage.setItem("userTotal", total.toFixed(2));
}

// ================== SAVE ORDER TO BACKEND ==================
async function saveOrderToBackend(cartItems) {
    for (const item of cartItems) {
        const orderData = {
            user_id: 1, // placeholder
            product_id: item.id || 1,
            quantity: item.qty
        };
        const res = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) throw new Error(await res.text());
    }
}

// ================== ADD TO CART ==================
function attachCartHandlers() {
    document.querySelectorAll(".product-row .box .btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.preventDefault();
            const box = btn.closest(".box");
            const name = box.querySelector("h3").textContent;
            const price = extractPrice(box.querySelector(".price").textContent);
            const img = box.querySelector("img").src;

            const existingItem = cart.find(item => item.name === name);
            if (existingItem) existingItem.qty++;
            else cart.push({ name, price, img, qty: 1 });

            btn.textContent = "Added ✅";
            btn.style.background = "green";
            setTimeout(() => {
                btn.textContent = "Add to cart";
                btn.style.background = "";
            }, 3000);

            updateCartUI();
        });
    });
}

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
