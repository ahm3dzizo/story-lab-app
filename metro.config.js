/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */

const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

// Get the default Expo configuration
const defaultConfig = getDefaultConfig(__dirname);

// Add minimal customization if absolutely needed
module.exports = {
  ...defaultConfig,
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    extraNodeModules: {
      // استخدام بدائل للوحدات المشكلة
      'stream': path.resolve(__dirname, 'shim/stream.js'),
      'ws': path.resolve(__dirname, 'shim/ws.js'),
      'buffer': path.resolve(__dirname, 'shim/buffer.js'),
      'process': path.resolve(__dirname, 'node_modules/process/browser.js')
    },
    resolveRequest: (context, moduleName, platform) => {
      console.log(`Resolving module: ${moduleName}`);
      
      // التعامل مع محاولة استيراد وحدة stream
      if (moduleName === 'stream' || moduleName.endsWith('/stream')) {
        console.log('Using stream shim');
        return {
          filePath: path.resolve(__dirname, 'shim/stream.js'),
          type: 'sourceFile',
        };
      }
      
      // التعامل مع محاولة استيراد وحدة ws
      if (moduleName === 'ws' || moduleName.endsWith('/ws')) {
        console.log('Using WebSocket shim');
        return {
          filePath: path.resolve(__dirname, 'shim/ws.js'),
          type: 'sourceFile',
        };
      }
      
      // التعامل مع محاولة استيراد وحدة buffer
      if (moduleName === 'buffer' || moduleName.endsWith('/buffer')) {
        console.log('Using Buffer shim');
        return {
          filePath: path.resolve(__dirname, 'shim/buffer.js'),
          type: 'sourceFile',
        };
      }
      
      // استخدام الحل الافتراضي لباقي الوحدات
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  // Keep transformer settings 
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  // تفعيل وضع التصحيح للحصول على سجلات أكثر تفصيلاً
  server: {
    ...defaultConfig.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        console.log(`Processing request: ${req.url}`);
        return middleware(req, res, next);
      };
    },
  },
}; 