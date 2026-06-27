# 🤖 Robô - Câmera com Moldura

Uma aplicação web moderna para tirar fotos e gravar vídeos com moldura personalizada, com suporte a **modo noturno** e **otimização para conexões lentas**.

## ✨ Funcionalidades

### 📸 Câmera
- ✅ Tirar fotos com moldura sobreposta
- ✅ Gravar vídeos com moldura e áudio
- ✅ Trocar entre câmera frontal e traseira
- ✅ Suporte para iOS e Android
- ✅ Conversão automática de vídeo para MP4

### 🌙 Modo Noturno
- ✅ Detecção automática da preferência do sistema
- ✅ Botão manual para alternar tema
- ✅ Preferência salva em localStorage
- ✅ Sincronização com mudanças do sistema

### 📡 Otimização para Conexões Lentas
- ✅ Detecção automática de conexão lenta (2G/3G ou modo economizar dados)
- ✅ Aviso visual ao usuário
- ✅ Redução de FPS (30 → 24 fps)
- ✅ Compactação inteligente de fotos (90% → 70% qualidade)
- ✅ Monitoramento em tempo real de mudanças de conexão

## 🚀 Como Usar

1. Clone o repositório
2. Adicione a imagem `moldura.png` na raiz do projeto
3. Abra `index.html` em um navegador moderno
4. Permita acesso à câmera quando solicitado

## 📱 Compatibilidade

- ✅ Chrome/Chromium (Android, Desktop)
- ✅ Firefox (Android, Desktop)
- ✅ Safari (iOS 14.5+)
- ✅ Edge

## 🔧 Tecnologias

- HTML5 Canvas
- WebRTC (getUserMedia)
- MediaRecorder API
- Web Storage API
- Network Information API
- CSS3 (Flexbox, Transitions)

## 📋 Estrutura de Arquivos

```
robo/
├── index.html      # HTML principal
├── app.js          # Lógica JavaScript
├── moldura.png     # Imagem da moldura
└── README.md       # Este arquivo
```

## 🌐 API Utilizada

O projeto utiliza a API Railway para conversão de vídeos:
- **Endpoint**: `https://video-converter-api-production-bb8e.up.railway.app/convert`
- **Método**: POST (FormData com arquivo de vídeo)

## 💾 Armazenamento Local

- `darkMode`: Booleano indicando preferência de tema (localStorage)

## 🎨 Modo Noturno

O tema é determinado por:
1. **Salvo localmente**: Se o usuário já escolheu um tema
2. **Preferência do sistema**: Se nenhuma preferência local existe
3. **Padrão**: Modo escuro ativado por padrão

## ⚠️ Detecção de Conexão Lenta

A aplicação detecta automaticamente:
- Tipo de conexão (2G, 3G, 4G, 5G)
- Modo de economizar dados ativado
- Mudanças de conexão em tempo real

Quando detectada uma conexão lenta:
- ⚠️ Aviso visual aparece no topo esquerdo
- 📹 FPS reduzido de 30 para 24
- 🖼️ Fotos compactadas a 70% da qualidade

## 🔒 Segurança

⚠️ **Importante**: A chave de segurança da API está visível no código. Para produção, implemente:
- Backend próprio para gerenciar conversões
- Autenticação JWT ou similar
- Rate limiting

## 📝 Notas

- Fotos são salvas em formato JPEG para otimizar tamanho
- Vídeos são automaticamente convertidos para MP4
- No iPhone, arquivos são salvos na pasta de Downloads
- A moldura é espelhada automaticamente na câmera frontal

## 👤 Autor

Desenvolvido com ❤️ por elianaconvites

---

**Versão**: 1.0.0  
**Data**: 2026-06-27