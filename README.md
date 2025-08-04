**Sample images of the PROJECT TEXTLAIRE**
<img width="1600" height="852" alt="Screenshot 2025-05-09 080024" src="https://github.com/user-attachments/assets/7ff97955-040d-4da0-82a2-077792864541" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075940" src="https://github.com/user-attachments/assets/5d944884-fbc6-4363-92ca-572005e03911" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075755" src="https://github.com/user-attachments/assets/07cf43b2-167d-4646-8397-d5c976646745" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075739" src="https://github.com/user-attachments/assets/64f2ff2b-cac2-45b0-8797-d40c954c9d27" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075641" src="https://github.com/user-attachments/assets/20a8f139-56ca-4884-a358-d9d2affb934c" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075634" src="https://github.com/user-attachments/assets/99a0ae69-efb8-485f-8d1c-d70869615bd6" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075629" src="https://github.com/user-attachments/assets/77d46964-01f2-4182-ac59-3af69f2457fc" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075621" src="https://github.com/user-attachments/assets/5b38fb0a-aeb8-4599-ae83-86d3889892ae" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075616" src="https://github.com/user-attachments/assets/07758a88-603f-4a07-8901-e4497e81e003" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075337" src="https://github.com/user-attachments/assets/c3af49bb-185f-48b4-8f1e-60f16c8e1502" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075330" src="https://github.com/user-attachments/assets/3c8c107e-8c59-4634-9eae-5532e901ee65" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075320" src="https://github.com/user-attachments/assets/e8fcce4c-9f36-45ca-b6e9-d57e6d322c19" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075315" src="https://github.com/user-attachments/assets/882e290c-cb7c-4db7-a108-c5920e5c98fe" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075304" src="https://github.com/user-attachments/assets/4c41bbbf-64cf-4a29-852b-183e11c833f8" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075257" src="https://github.com/user-attachments/assets/81f1dc5a-38f8-4496-b07a-33b9a045e5c5" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075253" src="https://github.com/user-attachments/assets/faf53b12-2b8d-4230-bead-a120e13622fb" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075248" src="https://github.com/user-attachments/assets/22bdf662-4def-4f7f-8103-c34b23396c77" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075243" src="https://github.com/user-attachments/assets/e33a8ead-c551-4b64-a47e-38c2e33a92f2" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075240" src="https://github.com/user-attachments/assets/44f9bb7b-f5f1-4037-b12c-929e6767b854" />
<img width="1600" height="852" alt="Screenshot 2025-05-09 075234" src="https://github.com/user-attachments/assets/68365b7c-abe1-4167-aeaa-96fc2354ad12" />

# 🧵 Texlaire: Smart Textile Management System

Texlaire is a comprehensive MERN-based web application designed to streamline textile manufacturing through features like workforce management, inventory control, real-time monitoring, and ML-powered design innovation.

---

## 📁 Project Structure

\`\`\`
textlaire/
├── client/         # Frontend (React + Vite)
├── server/         # Backend (Node.js + Express)
├── package.json    # Root scripts for full-stack operations
\`\`\`

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- Node.js (v16+ recommended)
- npm
- Git

---

## 📦 Installation

Clone the repository and install all dependencies:

\`\`\`bash
git clone https://github.com/kartikpanganti/textlaire.git
cd textlaire
npm run install
\`\`\`

This command will:
- Install client dependencies inside \`client/\`
- Install server dependencies inside \`server/\`
- Use \`--legacy-peer-deps\` to handle React/Vite issues

---

## 🏃 Running the App (Dev Mode)

Start both client and server concurrently:

\`\`\`bash
npm start
\`\`\`

- Client runs on: \`http://localhost:5173\`
- Server runs on: \`http://localhost:5000\` (or your custom port)

---

## 🌐 Tunneling (Optional)

To expose your local project to the web (e.g., for demos or webhook testing), run:

\`\`\`bash
npx localtunnel --port 5000
\`\`\`

---

## 🧪 Available Scripts

| Command            | Description                                      |
|--------------------|--------------------------------------------------|
| \`npm start\`        | Starts both client and server                    |
| \`npm run client\`   | Runs only the frontend (Vite)                    |
| \`npm run server\`   | Runs only the backend (Express)                 |
| \`npm run install\`  | Installs dependencies for both client and server|

---

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Utilities**: Concurrently, Localtunnel, Nanoid, WS

---

## 🔐 Environment Setup

Create the following \`.env\` file in \`/server\`:

\`\`\`env
PORT=5000
MONGO_URI=your_mongodb_connection_string
\`\`\`

You may also need a \`.env\` in \`/client\` for environment variables.

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🐛 Issues & Feedback

Encountered a bug or have a feature request?  
👉 [Submit an issue here](https://github.com/kartikpanganti/textlaire/issues)

---

## 🌟 Star this repo if you like the project!

[https://github.com/kartikpanganti/textlaire](https://github.com/kartikp)
