# flexiManage Controller (Modernized & Self-Hosted Fork)

This repository is a modernized, self-hosted fork of the official [flexiWAN](https://flexiwan.com/) `flexiManage` backend service and frontend management UI, updated for compatibility with modern Node.js runtimes and database engines.

---

## 🚀 Key Modernization Features

* **Node.js v22/v24 Runtime**: Updated backend dependencies and scripts to run seamlessly on modern Node.js releases.
* **Mongoose Refactoring**: Fixed legacy schema population methods across model handlers.
* **Modern Frontend UI**: Integrated Vite + React frontend dashboard in `frontend/`.
* **Submodule Cleanups**: Removed deprecated private submodules (`client`, `backend/billing`, `vpnportal`) to prevent git synchronization errors.

---

## 🛠️ Prerequisites

Ensure your host system has the following tools installed:

* **Node.js**: `v22.x` or newer (Tested up to `v24.x`)
* **npm**: `v10.x` or newer
* **Docker** (or local MongoDB `v6.0+` / `v8.0+` & Redis `v6.0+` services)

---

## 📦 Installation & Setup Guide

Follow these steps to install, build, and run flexiManage:

### Step 1: Start Database Services (MongoDB & Redis)

If using Docker:
```bash
# Run Redis container on port 6379
docker run -d --name flexi-redis -p 6379:6379 redis:latest

# Run MongoDB container on port 27017
docker run -d --name flexi-mongo -p 27017:27017 mongo:latest
```

Or verify system services if installed locally:
```bash
systemctl status mongod redis
```

---

### Step 2: Install Backend Dependencies

Navigate to the `backend` folder and install dependencies using `--legacy-peer-deps` to handle peer dependency resolutions:

```bash
cd backend
npm install --legacy-peer-deps
```

---

### Step 3: Install & Build Frontend UI

Navigate to the `frontend` directory, install packages, and build production assets:

```bash
cd ../frontend
npm install
npm run build
```

---

### Step 4: Deploy Frontend Assets to Backend

Copy the built static assets from `frontend/dist/` into `backend/public/` so the backend Express server can serve the Web UI directly:

```bash
cd ..
cp -r frontend/dist/* backend/public/
```

---

### Step 5: Start flexiManage Service

Start the backend API controller:

```bash
cd backend
npm start
```

The flexiManage controller will now be running. By default:
- HTTP / API: `http://localhost:3000` (or `https://localhost:3443` depending on SSL settings)
- Static Frontend UI is served from `backend/public/`

#### (Optional) Development Mode for Frontend
If developing or modifying the Web UI with hot-reloading:
```bash
cd frontend
npm run dev
```

---

## 👤 Creating an Initial Account

1. **Register a new user**:
   ```bash
   curl -X POST -k "https://localhost:3443/api/users/register" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"accountName":"account","userFirstName":"admin","userLastName":"user","email":"admin@example.com","password":"YourStrongPassword123","userJobTitle":"admin","userPhoneNumber":"","country":"US","companySize":"0-10","serviceType":"Provider","numberSites":"10","companyType":"","companyDesc":"","captcha":""}'
   ```

2. **Verify the account**:
   Copy the verification token and execute the account verification call:
   ```bash
   curl -X POST -k "https://localhost:3443/api/users/verify-account" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"id":"<VERIFICATION_ID>","token":"<VERIFICATION_TOKEN>"}'
   ```

3. **Log in**:
   ```bash
   curl -X POST -sD - -k "https://localhost:3443/api/users/login" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"username":"admin@example.com","password":"YourStrongPassword123","captcha":""}'
   ```

---

## 📄 License

This project is licensed under the GNU AGPLv3 License - see the [LICENSE](LICENSE) file for details.

