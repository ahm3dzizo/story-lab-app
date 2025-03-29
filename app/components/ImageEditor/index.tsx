import React, { useState } from 'react';
import { View, Image, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

interface ImageEditorProps {
  imageUri: string | null;
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string) => void | Promise<void>;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUri,
  visible,
  onClose,
  onSave,
}) => {
  const [rotation, setRotation] = useState(0);
  
  console.log('ImageEditor props:', { imageUri, visible, rotation });

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    console.log('New rotation:', (rotation + 90) % 360);
  };

  const handleSave = async () => {
    try {
      console.log('Saving image with rotation:', rotation);
      if (imageUri) {
        await onSave(imageUri);
      }
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  if (!visible || !imageUri) {
    console.log('ImageEditor not rendering:', { visible, imageUri });
    return null;
  }

  console.log('Rendering ImageEditor');
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <IconButton
            icon="close"
            iconColor="white"
            size={24}
            onPress={onClose}
          />
          <View style={styles.toolbarActions}>
            <IconButton
              icon="rotate-right"
              iconColor="white"
              size={24}
              onPress={handleRotate}
            />
            <IconButton
              icon="check"
              iconColor="white"
              size={24}
              onPress={handleSave}
            />
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              { transform: [{ rotate: `${rotation}deg` }] }
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
});

export default ImageEditor; 