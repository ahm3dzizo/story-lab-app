import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

interface ImageEditorProps {
  uri: string;
  onClose?: () => void;
  onSave?: (uri: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  uri,
  onClose,
  onSave,
}) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      <View style={styles.toolbar}>
        <IconButton icon="close" onPress={onClose} />
        <IconButton icon="content-save" onPress={() => onSave?.(uri)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ImageEditor; 