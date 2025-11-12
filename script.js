// ================== CONFIG ==================
const API_BASE = "https://saigenralstorebackend.onrender.com";  
let cart = JSON.parse(localStorage.getItem("userCart")) || [];

// ================== LOAD PRODUCTS FROM BACKEND ==================
async function loadProducts() {
  const container = document.querySelector(".categories .product-row");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products/`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();

    container.innerHTML = "";
    products.forEach(p => {
      const box = document.createElement("div");
      box.classList.add("box");
      box.innerHTML = `
        <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
        <h3>${p.name}</h3>
        <div class="price">₹${p.price}</div>
        <a href="#" class="btn" data-id="${p.id}" data-name="${p.name}"
           data-price="${p.price}" data-img="${p.image || ''}">Add to cart</a>
      `;
      container.appendChild(box);
    });

    attachCartHandlers();
  } catch (err) {
    console.error("❌ Error loading products:", err);
    container.innerHTML = `<p style="text-align:center;color:red;">⚠️ Failed to load products</p>`;
  }
}

// ================== ADD TO CART ==================
function attachCartHandlers() {
  document.querySelectorAll(".product-row .box .btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const product = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        img: btn.dataset.img,
        qty: 1
      };

      const existing = cart.find(item => item.id === product.id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push(product);
      }

      localStorage.setItem("userCart", JSON.stringify(cart));
      btn.textContent = "Added ✅";
      btn.style.background = "green";
      setTimeout(() => {
        btn.textContent = "Add to cart";
        btn.style.background = "";
      }, 2000);

      updateCartUI();
    });
  });
}

// ================== UPDATE CART UI ==================
function updateCartUI() {
  const cartIcon = document.querySelector("#cart-btn");
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Badge
  let badge = document.querySelector(".cart-count");
  if (!badge && cartIcon) {
    badge = document.createElement("span");
    badge.classList.add("cart-count");
    cartIcon.style.position = "relative";
    cartIcon.appendChild(badge);
  }
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";
  }

  // (Optional) You may update other cart UI if you have detailed cart page or a list.
}

// ================== SEARCH FUNCTIONALITY ==================
const searchInput = document.querySelector("#search-box");
if (searchInput) {
  searchInput.addEventListener("keyup", () => {
    const searchText = searchInput.value.toLowerCase().trim();
    document.querySelectorAll(".categories .product-row .box").forEach(box => {
      const name = box.querySelector("h3").textContent.toLowerCase();
      box.style.display = name.includes(searchText) ? "inline-block" : "none";
    });
  });
}

// ================== INITIALIZE ON DOM LOAD ==================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();
});
