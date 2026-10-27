# Farmer's Fresh 🌾

**Live demo:** https://sujit-s-123.github.io/farmers-fresh/ (browser-only demo; data is saved in your own browser)
**Local Farmer-to-Consumer Marketplace** — Web Programming project (CS23531)

Farmers list their harvest, nearby families order directly, and nobody sits in between.
The farmer earns more and the buyer gets fresher food at a lower price.

---

## Tech stack (mapped to the syllabus)

| Unit | Used for |
|---|---|
| I – HTML, CSS, Git, hosting | Page structure, custom warm theme (`frontend/src/styles/theme.css`), Git repo |
| II – JavaScript | Form validation, cart totals, event handlers, DOM updates |
| III – PHP, MySQL, Bootstrap | REST-style API in `backend/api`, MySQL database, Bootstrap 5 grid and components |
| IV – ReactJS | Components (`ProductCard`, `Navbar`, layouts), JSX, Vite dev setup |
| V – React dataflow | `useState`, `useEffect`, Context (Auth, Cart, Toast), props, React Router, protected routes |

---

## Folder structure

```
farmers-fresh/
├── backend/                 PHP API (goes inside XAMPP htdocs)
│   ├── config.php           database settings
│   ├── lib.php              shared helpers: DB, JSON, sessions, role checks
│   ├── api/                 auth, products, catalog, orders, reviews, farmer, admin, contact
│   └── uploads/             farmer photo uploads
├── database/
│   └── farmers_fresh.sql    schema + demo data (import once)
└── frontend/                React + Vite + Bootstrap
    ├── public/images/products/   30 product illustrations
    └── src/
        ├── components/  layouts/  context/
        └── pages/  public/  consumer/  farmer/  admin/  shared/
```

---

## How to run it (Windows + XAMPP)

**You need:** [XAMPP](https://www.apachefriends.org/) (PHP 8.1 or newer) and [Node.js](https://nodejs.org/) 18 or newer.

1. **Copy the project into htdocs** so the backend is at
   `C:\xampp\htdocs\farmers-fresh\backend`
2. **Start XAMPP** → start **Apache** and **MySQL**.
3. **Create the database:** open <http://localhost/phpmyadmin> → **Import** tab →
   choose `database/farmers_fresh.sql` → **Import**.
   (This creates the `farmers_fresh` database with demo data.)
4. **Check the API:** open <http://localhost/farmers-fresh/backend/> — you should see
   `"Farmer's Fresh API is running"`.
5. **Start the website:**
   ```bash
   cd C:\xampp\htdocs\farmers-fresh\frontend
   npm install
   npm run dev
   ```
6. Open **<http://localhost:5173>** 🎉

> If your MySQL has a password, edit `backend/config.php`.
> If you put the backend somewhere else, create `frontend/.env` with
> `BACKEND_URL=http://localhost/your-folder/backend`.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Consumer | priya@farmersfresh.in | consumer123 |
| Consumer | arun@farmersfresh.in | consumer123 |
| Farmer | murugan@farmersfresh.in | farmer123 |
| Farmer | lakshmi@farmersfresh.in | farmer123 |
| Farmer | selvam@farmersfresh.in | farmer123 |
| Farmer (awaiting approval) | ravi@farmersfresh.in | farmer123 |
| Admin | admin@farmersfresh.in | admin123 |

The login page has one-click buttons to fill these in.

---

## Pages for each role

**Public:** Home · Shop (search, category, district, price, natural-only filters, sorting) · Product details · About · Contact · Login · Register

**Consumer:** Cart · Checkout (cash on delivery or farm pickup) · My Orders with a status tracker and cancel option · Reviews (after delivery) · Profile

**Farmer:** Dashboard (earnings, weekly sales chart, best sellers, low-stock alerts) · My Products (edit, hide, delete) · Add Product (pick from the 30-item catalog — photo, description, benefits and season fill in automatically; optional own photo upload) · Orders Received (Accept → Packed → Delivered, or Reject) · Farm Profile

**Admin:** Overview (charts and recent orders) · Farmers (approve / block) · Consumers · Products (remove bad listings) · All Orders · Messages from the contact form

---

## Suggested demo flow (for your review)

1. Log in as **Priya** → add Mango and Potato to the cart → checkout. Two orders are created, one per farm.
2. Log in as **Selvam** → Orders Received → Accept → Mark as packed → Mark as delivered.
3. Log in as **Priya** → My Orders shows the tracker moving → write a review on the product.
4. Register a **new farmer** → it waits for approval → log in as **Admin** → Farmers → Approve.

---

## Browser-only demo (no XAMPP)

`npm run build:demo` builds a version that runs entirely in the browser: requests go to
`src/demo/mockApi.js` (a JavaScript copy of the PHP API) and data is kept in the browser's
localStorage. Open `frontend/dist-demo/index.html` through any static server to try it.
Use the real XAMPP setup above for your project submission.

## Security features

- Passwords stored with `password_hash()` / checked with `password_verify()`
- All SQL uses **PDO prepared statements** (no SQL injection)
- Session-based login; **every API checks the user's role** (React route guards are only for convenience)
- Stock is locked (`SELECT … FOR UPDATE`) and reduced inside a **transaction** so two buyers can't oversell
- Uploads: JPG/PNG/WEBP only, max 2 MB, checked by real file type, random file names, scripts disabled in `uploads/`

## Notes

- **Product photos** are real photos from Wikimedia Commons under free licences (CC0, CC BY, CC BY-SA,
  public domain), saved in `frontend/public/images/products/<name>.jpg`, so they work without internet.
  The photographers are credited on the **Photo credits** page (`/credits`) and under each product photo,
  as the licences require. Credits are listed in `frontend/src/photos.json`.
- To change a photo, replace the `.jpg` file with one of the same name.
- Farmers can still upload their own photo for any listing.
- Fonts (Lora + Nunito) load from Google Fonts; without internet the site falls back to system fonts.
- Payments are cash on delivery / pickup only — no real payment gateway.
