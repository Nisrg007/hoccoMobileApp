# 🚀 Vercel Deployment Guide for Hocco Admin Panel

This guide will help you deploy your React Native Web admin panel to Vercel.

## 📋 **What Was Set Up**

✅ **React Native Web Configuration**
- Added `react-native-web` and `react-dom` dependencies
- Created webpack configuration for web builds
- Added web entry point (`index.web.js`)
- Created HTML template for web deployment

✅ **Build Scripts**
- `npm run start:web` - Start development server
- `npm run build:web` - Build for production

✅ **Vercel Configuration**
- `vercel.json` - Vercel deployment settings
- SPA routing support
- Custom build commands

✅ **Environment Setup**
- `.env.example` - Template for environment variables
- Updated `.gitignore` for web builds and env files

## 🛠️ **Installation Steps**

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Set Up Environment Variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
# REACT_NATIVE_API_URL=https://your-backend-api.vercel.app/api
# REACT_NATIVE_ADMIN_SECRET_KEY=your-secret-key
```

### 3. **Test Local Development**
```bash
# Start web development server
npm run start:web

# Visit http://localhost:3000
```

### 4. **Test Production Build**
```bash
# Build for production
npm run build:web

# Check that dist/ folder is created
```

## 🌐 **Vercel Deployment**

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: hocco-admin-panel
# - Directory: ./
```

### Option B: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Select the `admin` branch
5. Vercel will auto-detect the configuration

## ⚙️ **Environment Variables in Vercel**

After deployment, add these environment variables in your Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - `REACT_NATIVE_API_URL`
   - `REACT_NATIVE_ADMIN_SECRET_KEY`  
   - `REACT_NATIVE_MAPBOX_ACCESS_TOKEN`
   - etc.

3. **Important**: For web builds, environment variables must be prefixed with `REACT_NATIVE_` to be accessible.

## 🔧 **Configuration Details**

### **Webpack Configuration**
- Entry point: `index.web.js`
- Aliases `react-native` to `react-native-web`
- Handles TypeScript, images, and CSS
- Configured for SPA routing

### **Vercel Configuration**
```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}],
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist"
}
```

## 📱 **Platform Compatibility**

This setup supports:
- ✅ **Web (Vercel)** - Primary deployment target
- ✅ **Mobile (React Native)** - Original mobile apps still work
- ✅ **Cross-platform components** - Shared UI logic

## 🚨 **Important Notes**

1. **Mobile-specific packages** like `react-native-background-geolocation` may not work on web
2. **Platform detection** - Use `Platform.OS === 'web'` for web-specific code
3. **Environment variables** - Must use `REACT_NATIVE_` prefix for web access
4. **Navigation** - May need to add React Router for complex web navigation

## 🔍 **Troubleshooting**

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build:web
```

### Platform-specific Code
```tsx
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Mobile-specific code
}
```

### Missing Dependencies
If you get webpack errors, install missing dependencies:
```bash
npm install babel-loader @babel/preset-env @babel/preset-react
```

## ✨ **Next Steps**

1. **Deploy to Vercel**
2. **Add your backend API endpoints**
3. **Configure authentication**
4. **Add admin panel features**
5. **Test on both web and mobile**

Your admin panel is now ready for Vercel deployment! 🎉