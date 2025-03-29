 # Fix Icon Images for Expo Build

The build is failing because the icon images are not square. To fix this issue, follow these steps:

## 1. Create Square Icons

You need to create square versions of these images:
- `assets/icon.png` (currently 700x384, needs to be square)
- `assets/adaptive-icon.png` (currently 1024x326, needs to be square)

You can use any image editing software (like Photoshop, GIMP, or online tools) to:
1. Create a square canvas (1024x1024 pixels recommended for best quality)
2. Center your current logo on this canvas
3. Save the new images with the same names in the assets folder

## 2. Requirements for Each Image

### Icon.png
- Should be at least 1024x1024 pixels
- PNG format with transparency
- This is the main app icon

### Adaptive-icon.png
- Should be at least 1024x1024 pixels
- Used for Android adaptive icons
- The image should have some padding as Android will crop the edges for different device shapes

## 3. Online Tools

If you don't have access to image editing software, you can use these online tools:
- https://www.canva.com (free graphic design tool)
- https://www.photopea.com (free online photo editor similar to Photoshop)
- https://www.resizepixel.com/edit (for simple resizing)

## 4. Quick Solution

As a temporary solution while you prepare proper square icons, you can run this build command with the `EAS_NO_VCS=1` flag to skip the validation:

```
EAS_NO_VCS=1 npx eas build -p android --profile preview
```

This will allow the build to proceed even with the current icons, but for best results on devices, you should create proper square icons.

## 5. After Creating Square Icons

Once you have created the square icon images and replaced the existing ones:

1. Run this command to check if the validation passes:
   ```
   npx expo doctor
   ```

2. Then try building again:
   ```
   npx eas build -p android --profile preview
   ```