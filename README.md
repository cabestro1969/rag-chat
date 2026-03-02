# RAG Chat — Deploy en Vercel

## Estructura del proyecto

```
rag-chat/
├── public/
│   └── index.html       ← Frontend (chat sin panel de subida)
├── api/
│   └── chat.js          ← Backend serverless (guarda tu API Key)
├── vercel.json          ← Configuración de rutas
└── README.md
```

## Pasos para subir a Vercel

### 1. Instala Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

### 2. Inicia sesión en Vercel
```bash
vercel login
```

### 3. Despliega desde la carpeta del proyecto
```bash
cd rag-chat
vercel
```
Responde a las preguntas:
- Set up and deploy? → **Y**
- Which scope? → tu cuenta
- Link to existing project? → **N**
- Project name? → `rag-chat` (o el que quieras)
- In which directory is your code? → **./**

### 4. Añade tu API Key de Anthropic como variable de entorno

En el dashboard de Vercel (vercel.com):
1. Entra en tu proyecto → **Settings** → **Environment Variables**
2. Añade:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (tu clave)
   - **Environment:** Production, Preview, Development ✓

O por CLI:
```bash
vercel env add ANTHROPIC_API_KEY
```

### 5. Redespliega para que tome la variable
```bash
vercel --prod
```

¡Listo! Tendrás una URL pública tipo `https://rag-chat-xxx.vercel.app`

---

## Uso
- Abre la URL en el navegador
- Haz clic en el **clip** (📎) para adjuntar PDFs — se procesan en el navegador
- Escribe preguntas — el servidor usa el contexto de los PDFs para responder
- La API Key queda segura en el servidor, el usuario nunca la ve
